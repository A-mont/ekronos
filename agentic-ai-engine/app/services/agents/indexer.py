from __future__ import annotations

import asyncio
import json
import re
from typing import Any, Dict, Optional, Tuple

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


def _validate_risk_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    if "risk_analysis" not in payload or not isinstance(payload["risk_analysis"], dict):
        return False, "Missing 'risk_analysis' object."

    r = payload["risk_analysis"]

    required = [
        "overall_risk_score",
        "risk_level",
        "dimensions",
        "trend_indicators",
        "key_risks",
        "mitigations",
        "assumptions",
        "notes",
    ]
    for k in required:
        if k not in r:
            return False, f"Missing risk_analysis.{k}"

    if not isinstance(r["overall_risk_score"], (int, float)) or not (0 <= r["overall_risk_score"] <= 100):
        return False, "overall_risk_score must be 0..100."

    if r["risk_level"] not in {"low", "medium", "high"}:
        return False, "risk_level must be low|medium|high."

    dims = r["dimensions"]
    if not isinstance(dims, dict) or not dims:
        return False, "dimensions must be non-empty object."

    for k, v in dims.items():
        if not isinstance(v, (int, float)) or not (0 <= v <= 100):
            return False, f"dimension '{k}' must be 0..100."

    trends = r["trend_indicators"]
    if not isinstance(trends, list) or not trends:
        return False, "trend_indicators must be non-empty array."

    for t in trends:
        if not all(k in t for k in ("name", "unit", "series")):
            return False, "Each trend must have name, unit, series."
        if not isinstance(t["series"], list) or not t["series"]:
            return False, "trend.series must be non-empty array."
        for p in t["series"]:
            if not all(k in p for k in ("t", "v")):
                return False, "Each series point must have t, v."

    if not isinstance(r["key_risks"], list):
        return False, "key_risks must be array."
    if not isinstance(r["mitigations"], list):
        return False, "mitigations must be array."
    if not isinstance(r["assumptions"], list):
        return False, "assumptions must be array."
    if not isinstance(r["notes"], str):
        return False, "notes must be string."

    extra = set(payload.keys()) - {"risk_analysis"}
    if extra:
        return False, f"Unexpected top-level keys: {sorted(extra)}"

    return True, "ok"


class IndexerAgent(BaseAgent):
    """
    Risk & Trend Analysis Agent.
    Produces structured JSON suitable for charts and dashboards.
    """

    name = "indexer"

    async def run(self, req: AgentRequest) -> AgentResponse:
        system_prompt = (
            "You are a professional risk analyst specializing in crypto, DeFi, and protocol design. "
            "You analyze systemic, market, liquidity, technical, governance, and regulatory risks. "
            "You MUST return strictly valid JSON and nothing else. "
            "All scores must be numeric and suitable for visualization."
        )

        user_prompt = f"""
USER CONTEXT:
{req.goal}

Analyze the risk profile and trends of this use case.

Return STRICT JSON ONLY with this exact schema:

{{
  "risk_analysis": {{
    "overall_risk_score": 0-100,
    "risk_level": "low|medium|high",
    "dimensions": {{
      "market": 0-100,
      "liquidity": 0-100,
      "technical": 0-100,
      "governance": 0-100,
      "regulatory": 0-100
    }},
    "trend_indicators": [
      {{
        "name": "indicator_name",
        "unit": "index|percent|score",
        "series": [
          {{ "t": "time_label", "v": number }}
        ]
      }}
    ],
    "key_risks": [
      {{
        "category": "Market|Liquidity|Technical|Governance|Regulatory",
        "severity": "low|medium|high",
        "description": "Concise professional explanation"
      }}
    ],
    "mitigations": [
      {{
        "risk": "Short risk name",
        "action": "Concrete mitigation suggestion"
      }}
    ],
    "assumptions": ["Assumptions used in this analysis"],
    "notes": "Important caveats or interpretation notes"
  }}
}}

Rules:
- Output MUST be valid JSON (double quotes).
- Scores must be realistic and consistent.
- Trend series should have at least 3 points.
- Do not add any keys outside the schema.
""".strip()

        raw = await asyncio.to_thread(
            self.llm.chat,
            model="gpt-5.1",
            system=system_prompt,
            user=user_prompt,
            reasoning_effort="high",
        )

        payload = _extract_json_object(raw)
        if payload is None:
            return AgentResponse(
                agent=self.name,
                summary="Agent returned non-JSON output (cannot parse risk analysis).",
                result={"ok": False, "raw": raw},
            )

        ok, reason = _validate_risk_payload(payload)
        if not ok:
            return AgentResponse(
                agent=self.name,
                summary=f"Invalid risk analysis JSON: {reason}",
                result={"ok": False, "reason": reason, "payload": payload, "raw": raw},
            )

        return AgentResponse(
            agent=self.name,
            summary="Generated structured risk and trend analysis (chart-ready).",
            result={"ok": True, **payload},
        )
