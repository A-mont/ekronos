from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Dict, Optional, Tuple, List

from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse


def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
    text = text.strip()

    try:
        obj = json.loads(text)
        if isinstance(obj, dict):
            return obj
    except Exception:
        pass

    m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        try:
            obj = json.loads(m.group(1))
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass

    m2 = re.search(r"(\{.*\})", text, flags=re.DOTALL)
    if m2:
        try:
            obj = json.loads(m2.group(1))
            if isinstance(obj, dict):
                return obj
        except Exception:
            pass

    return None


def _validate_tokenomics(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Strict tokenomics schema validation.

    Required shape:
    {
      "tokenomics": {
        "name": "...",
        "symbol": "...",
        "total_supply": "1000000",
        "decimals": 18,
        "distribution": [
          {
            "category": "Community",
            "percent": 40,
            "rationale": "...",
            "vesting": { "type": "...", "cliff_months": 0, "duration_months": 0 }
          }
        ],
        "assumptions": ["..."],
        "notes": "..."
      }
    }
    """
    if "tokenomics" not in payload or not isinstance(payload["tokenomics"], dict):
        return False, "Missing 'tokenomics' object."

    t = payload["tokenomics"]

    for k in ["name", "symbol", "total_supply", "decimals", "distribution", "assumptions", "notes"]:
        if k not in t:
            return False, f"Missing tokenomics.{k}"

    if not isinstance(t["name"], str) or not t["name"].strip():
        return False, "tokenomics.name must be non-empty string."
    if not isinstance(t["symbol"], str) or not t["symbol"].strip():
        return False, "tokenomics.symbol must be non-empty string."
    if not isinstance(t["total_supply"], str) or not t["total_supply"].strip():
        return False, "tokenomics.total_supply must be string (use string for big ints)."
    if not isinstance(t["decimals"], int) or not (0 <= t["decimals"] <= 18):
        return False, "tokenomics.decimals must be int 0..18."

    dist = t["distribution"]
    if not isinstance(dist, list) or len(dist) < 3:
        return False, "tokenomics.distribution must be an array with at least 3 entries."

    total = 0
    for i, row in enumerate(dist):
        if not isinstance(row, dict):
            return False, f"distribution[{i}] must be object."
        for k in ["category", "percent", "rationale", "vesting"]:
            if k not in row:
                return False, f"distribution[{i}] missing '{k}'."

        if not isinstance(row["category"], str) or not row["category"].strip():
            return False, f"distribution[{i}].category must be non-empty string."
        if not isinstance(row["percent"], (int, float)):
            return False, f"distribution[{i}].percent must be number."
        if row["percent"] <= 0:
            return False, f"distribution[{i}].percent must be > 0."
        if not isinstance(row["rationale"], str) or not row["rationale"].strip():
            return False, f"distribution[{i}].rationale must be non-empty string."

        vest = row["vesting"]
        if not isinstance(vest, dict):
            return False, f"distribution[{i}].vesting must be object."
        for vk in ["type", "cliff_months", "duration_months"]:
            if vk not in vest:
                return False, f"distribution[{i}].vesting missing '{vk}'."
        if not isinstance(vest["type"], str) or not vest["type"].strip():
            return False, f"distribution[{i}].vesting.type must be string."
        if not isinstance(vest["cliff_months"], int) or vest["cliff_months"] < 0:
            return False, f"distribution[{i}].vesting.cliff_months must be int >= 0."
        if not isinstance(vest["duration_months"], int) or vest["duration_months"] < 0:
            return False, f"distribution[{i}].vesting.duration_months must be int >= 0."

        total += float(row["percent"])

    if abs(total - 100.0) > 0.01:
        return False, f"Distribution percents must sum to 100. Got {total}."

    if not isinstance(t["assumptions"], list) or not all(isinstance(x, str) for x in t["assumptions"]):
        return False, "tokenomics.assumptions must be array of strings."
    if not isinstance(t["notes"], str):
        return False, "tokenomics.notes must be string."

    extra_top = set(payload.keys()) - {"tokenomics"}
    if extra_top:
        return False, f"Unexpected top-level keys: {sorted(extra_top)}"

    return True, "ok"


class EconomyAgent(BaseAgent):
    name = "economy"

    async def run(self, req: AgentRequest) -> AgentResponse:
        system_prompt = (
            "You are a tokenomics designer. "
            "You MUST return strictly valid JSON and nothing else. "
            "No markdown fences. No extra commentary. "
            "Choose sensible token distribution percentages that sum to 100. "
            "Explain the rationale per category."
        )

        user_prompt = f"""
USER PROMPT:
{req.goal}

Return STRICT JSON ONLY with this exact schema:

{{
  "tokenomics": {{
    "name": "Token name",
    "symbol": "SYMBOL",
    "total_supply": "1000000000",
    "decimals": 18,
    "distribution": [
      {{
        "category": "Community & Incentives",
        "percent": 40,
        "rationale": "1-2 sentences explaining why this percent fits the use case.",
        "vesting": {{
          "type": "none|linear|cliff+linear",
          "cliff_months": 0,
          "duration_months": 0
        }}
      }}
    ],
    "assumptions": ["Short bullet assumptions derived from the user prompt."],
    "notes": "Any important caveats or suggestions."
  }}
}}

Rules:
- Output must be VALID JSON (double quotes).
- distribution.percent values MUST sum to exactly 100.
- Include 4 to 7 distribution categories.
- Provide vesting for each category (use 'none' for fully liquid allocations).
- Do not add any keys outside the schema.
""".strip()

        raw = await asyncio.to_thread(
            self.llm.chat,
            model="gpt-5",
            system=system_prompt,
            user=user_prompt,
            reasoning_effort="high",
        )

        payload = _extract_json_object(raw)
        if payload is None:
            return AgentResponse(
                agent=self.name,
                summary="Agent returned non-JSON output (cannot parse tokenomics).",
                result={"ok": False, "raw": raw},
            )

        ok, reason = _validate_tokenomics(payload)
        if not ok:
            return AgentResponse(
                agent=self.name,
                summary=f"Invalid tokenomics JSON: {reason}",
                result={"ok": False, "reason": reason, "payload": payload, "raw": raw},
            )

        return AgentResponse(
            agent=self.name,
            summary="Generated tokenomics JSON (distribution + rationale) for gateway/use-case.",
            result={"ok": True, **payload},
        )
