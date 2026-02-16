from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Dict, Optional, Tuple

from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse



def _coerce_to_json(text: str) -> str:
    """
    Best-effort normalization to JSON:
    - Extracts first {...}
    - Removes trailing semicolons
    - Removes JS-style // comments
    - Quotes unquoted keys
    - Converts single quotes to double quotes (best-effort)
    """
    text = text.strip()

    # If fenced, take inside
    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        text = m.group(1).strip()

    # Extract first {...}
    m2 = re.search(r"(\{.*\})", text, flags=re.DOTALL)
    if m2:
        text = m2.group(1).strip()

    text = re.sub(r";\s*$", "", text)
    text = re.sub(r"(?m)^\s*//.*$", "", text)
    text = re.sub(r"(?m)(?<!:)//.*$", "", text)

    # Quote unquoted keys
    text = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):', r'\1"\2"\3:', text)

    # Replace single quotes with double quotes (best-effort)
    text = re.sub(r"'", r'"', text)

    return text


def _extract_object(raw: str) -> Optional[Dict[str, Any]]:
    raw = (raw or "").strip()
    if not raw:
        return None

    try:
        obj = json.loads(raw)
        return obj if isinstance(obj, dict) else None
    except Exception:
        pass

    try:
        coerced = _coerce_to_json(raw)
        obj = json.loads(coerced)
        return obj if isinstance(obj, dict) else None
    except Exception:
        return None


def _validate_hex_address(addr: str) -> bool:
    
    return bool(re.fullmatch(r"0x[0-9a-fA-F]{2,}", addr))


def _validate_liquidity_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Required EXACT shape:
    {
      "token": "0x...",
      "registered_token": null | "0x..."
    }
    No extra keys allowed.
    """
    required = ("token", "registered_token")
    for k in required:
        if k not in payload:
            return False, f"Missing '{k}'."

    # Forbid extra keys
    allowed = set(required)
    extra = set(payload.keys()) - allowed
    if extra:
        return False, f"Unexpected keys: {sorted(extra)}"

    token = payload["token"]
    if not isinstance(token, str) or not _validate_hex_address(token):
        return False, "'token' must be a hex string like 0x..."

    rt = payload["registered_token"]
    if rt is None:
        return True, "ok"
    if isinstance(rt, str) and _validate_hex_address(rt):
        return True, "ok"
    return False, "'registered_token' must be null or a hex string like 0x..."


def _guess_token_from_context_or_goal(req: AgentRequest) -> Optional[str]:
    # Prefer context values if your orchestrator passes them
    ctx = getattr(req, "context", None) or {}
    if isinstance(ctx, dict):
        for key in ("token", "program_id", "programId", "vft_program_id", "vftProgramId"):
            v = ctx.get(key)
            if isinstance(v, str) and _validate_hex_address(v):
                return v

    goal = getattr(req, "goal", "") or ""
    m = re.search(r"0x[0-9a-fA-F]{2,}", goal)
    if m:
        return m.group(0)

    return None


class LiquidityAgent(BaseAgent):
    name = "liquidity"

    async def run(self, req: AgentRequest) -> AgentResponse:
        
        token_hint = _guess_token_from_context_or_goal(req) or "0x..."

        system_prompt = (
            "You are a liquidity registration agent for Vara. "
            "You MUST return STRICT valid JSON and nothing else. "
            "No markdown. No explanations. "
            "Return ONE JSON object with EXACTLY these keys: "
            "token (string), registered_token (null or string)."
        )

        user_prompt = f"""
Goal / context:
{req.goal}

Return ONLY this exact JSON schema (no extra keys):

{{
  "token": "{token_hint}",
  "registered_token": null
}}

Rules:
- Output MUST be valid JSON (double quotes).
- token: must be a 0x... hex string (the deployed token/program address).
- registered_token: null if not registered yet, or a 0x... hex string if registration succeeded.
- Do NOT include any other keys.
""".strip()

        raw = await asyncio.to_thread(
            self.llm.chat,
            model="gpt-5",
            reasoning_effort="low",
            system=system_prompt,
            user=user_prompt,
        )

        payload = _extract_object(raw)
        if payload is None:
            
            fallback_token = _guess_token_from_context_or_goal(req)
            if fallback_token:
                fallback = {"token": fallback_token, "registered_token": None}
                return AgentResponse(
                    agent=self.name,
                    summary="Liquidity payload fallback (model output was not JSON).",
                    result={"ok": True, "liquidity": fallback, "raw": raw},
                )

            return AgentResponse(
                agent=self.name,
                summary="Agent returned non-JSON output (could not parse liquidity payload).",
                result={"ok": False, "raw": raw},
            )

        ok, reason = _validate_liquidity_payload(payload)
        if not ok:

            inferred = _guess_token_from_context_or_goal(req)
            if inferred:
                repaired = {"token": inferred, "registered_token": None}
                ok2, _ = _validate_liquidity_payload(repaired)
                if ok2:
                    return AgentResponse(
                        agent=self.name,
                        summary=f"Liquidity payload repaired (original invalid: {reason}).",
                        result={"ok": True, "liquidity": repaired, "raw": raw, "payload": payload},
                    )

            return AgentResponse(
                agent=self.name,
                summary=f"Liquidity payload invalid: {reason}",
                result={"ok": False, "reason": reason, "payload": payload, "raw": raw},
            )

        return AgentResponse(
            agent=self.name,
            summary="Liquidity payload generated.",
            result={"ok": True, "liquidity": payload},
        )
