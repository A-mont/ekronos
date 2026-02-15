from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Dict, Optional, Tuple

from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse
from app.services.training_config import get_training_dir
from app.utils.utils import load_training_files


def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    """
    Tries to parse a JSON object from a model response.
    Accepts:
      - pure JSON
      - JSON wrapped in markdown fences
      - JSON preceded/followed by accidental text
    """
    text = text.strip()

    # 1) Pure JSON
    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            return obj
    except Exception:
        pass

    # 2) Markdown fenced ```json ... ```
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        try:
            obj = json.loads(m.group(1))
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass

    # 3) First {...} block (best-effort)
    # This is a simple heuristic; good enough for controlled outputs.
    m2 = re.search(r"(\{.*\})", text, flags=re.DOTALL)
    if m2:
        candidate = m2.group(1).strip()
        try:
            obj = json.loads(candidate)
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass

    return None


def _validate_pr_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Minimal validation for PR payload shape.
    """
    if "files" not in payload or not isinstance(payload["files"], dict):
        return False, "Missing 'files' dict."
    if "pr" not in payload or not isinstance(payload["pr"], dict):
        return False, "Missing 'pr' dict."

    pr = payload["pr"]
    if not pr.get("title") or not isinstance(pr.get("title"), str):
        return False, "Missing 'pr.title' string."
    if not pr.get("body") or not isinstance(pr.get("body"), str):
        return False, "Missing 'pr.body' string."

    # Optional base/branch
    if "base" in pr and not isinstance(pr["base"], str):
        return False, "'pr.base' must be string if provided."
    if "branch" in pr and not isinstance(pr["branch"], str):
        return False, "'pr.branch' must be string if provided."

    # Validate file paths are strings and contents are strings
    for k, v in payload["files"].items():
        if not isinstance(k, str) or not isinstance(v, str):
            return False, "All file paths and contents in 'files' must be strings."
        # Security: forbid path traversal
        if ".." in k.replace("\\", "/").split("/"):
            return False, f"Forbidden path traversal in file path: {k}"
        if k.startswith("/") or k.startswith("\\"):
            return False, f"Absolute paths are not allowed: {k}"

    return True, "ok"


class SmartProgramAgent(BaseAgent):
    name = "smart_program"

    async def run(self, req: AgentRequest) -> AgentResponse:
        training_dir = get_training_dir(self.name)

        training_data = (
            load_training_files(training_dir, max_files=12, max_chars_total=20000)
            if training_dir
            else "(No training data configured for this agent.)"
        )

        system_prompt = (
            "You are a senior software architect and deep reasoning expert. "
            "You produce implementable plans and clean, testable code. "
            "You MUST return strictly valid JSON and nothing else. "
            "Output in English."
        )

        # The crucial part: force the model to return a PR payload
        user_prompt = f"""\
INTERNAL TRAINING DATA (role-specific, authoritative):
{training_data}

USER GOAL:
{req.goal}

You must produce a Git-ready change set and PR metadata.

Return STRICT JSON ONLY with this schema:

{{
  "pr": {{
    "title": "short title",
    "body": "markdown description including what/why/how to test",
    "base": "main"
  }},
  "files": {{
    "path/relative/to/repo/file1.ext": "FULL FILE CONTENTS",
    "path/relative/to/repo/file2.ext": "FULL FILE CONTENTS"
  }}
}}

Rules:
- Do NOT include markdown fences.
- Do NOT include explanations outside JSON.
- 'files' must include ALL changed/new files with full contents.
- Prefer minimal changes. If you are unsure, include TODO comments in code.
- Never output absolute paths. Never use '..' in paths.
- Ensure code compiles/runs (best effort) and include "How to test" in PR body.
"""

        # Run sync OpenAI call in a thread so async server stays responsive
        raw = await asyncio.to_thread(
            self.llm.chat,
            model="gpt-5",
            system=system_prompt,
            user=user_prompt,
            reasoning_effort="high",
        )

        payload = _extract_json_object(raw)
        if payload is None:
            # Return raw for debugging
            return AgentResponse(
                agent=self.name,
                summary="Agent returned non-JSON output (cannot create PR payload).",
                result={"ok": False, "raw": raw},
            )

        ok, reason = _validate_pr_payload(payload)
        if not ok:
            return AgentResponse(
                agent=self.name,
                summary=f"Invalid PR payload: {reason}",
                result={"ok": False, "reason": reason, "payload": payload, "raw": raw},
            )

        # ✅ compatible with /pr/create endpoint: {title, body, base, files}
        pr = payload["pr"]
        files = payload["files"]

        return AgentResponse(
            agent=self.name,
            summary="Generated PR payload (title/body/files) ready for /pr/create.",
            result={
                "ok": True,
                "pr": {
                    "title": pr["title"],
                    "body": pr["body"],
                    "base": pr.get("base", "main"),
                    "branch": pr.get("branch"),  # optional
                },
                "files": files,
            },
        )
