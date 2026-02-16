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
    - Converts single quotes to double quotes (best-effort)
    - Quotes unquoted object keys: { admins: [...] } -> { "admins": [...] }
    - Removes trailing semicolons
    - Removes JS-style // comments (common in model outputs)
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

    # Remove trailing semicolon
    text = re.sub(r";\s*$", "", text)

    # Remove // comments (to allow the example format)
    text = re.sub(r"(?m)^\s*//.*$", "", text)
    text = re.sub(r"(?m)(?<!:)//.*$", "", text)  # inline // ... (best-effort)

    # Quote unquoted keys: { admins: ... } -> { "admins": ... }
    text = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):', r'\1"\2"\3:', text)

    # Replace single quotes with double quotes (best-effort)
    text = re.sub(r"'", r'"', text)

    return text


def _extract_vft_object(raw: str) -> Optional[Dict[str, Any]]:
    raw = raw.strip()

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
    # Relaxed: 0x + hex, at least 2 hex chars
    return bool(re.fullmatch(r"0x[0-9a-fA-F]{2,}", addr))


def _validate_uint_string(s: str) -> bool:
    # Non-empty decimal integer string (no sign, no decimals)
    return bool(re.fullmatch(r"[0-9]+", s))


def _validate_vft_payload(payload: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validates required shape:
    {
      "admins": ["0x..."],
      "name": "Token",
      "symbol": "SYM",
      "decimals": 18,
      "mint_amount": "1000000000000000000",
      "mint_to": "0x..."
    }

    NOTE:
    - 'mint_amount' MUST be a base-10 uint string (digits only).
    - If the model returns an int, we coerce it to string.
    - Floats / scientific notation / separators are rejected.
    """
    required = ("admins", "name", "symbol", "decimals", "mint_amount", "mint_to")
    for k in required:
        if k not in payload:
            return False, f"Falta '{k}'."

    admins = payload["admins"]
    if not isinstance(admins, list) or not admins or not all(isinstance(a, str) for a in admins):
        return False, "'admins' debe ser un arreglo no vacío de strings."

    for a in admins:
        if not _validate_hex_address(a):
            return False, f"Formato inválido de admin: {a}"

    if not isinstance(payload["name"], str) or not payload["name"].strip():
        return False, "'name' debe ser un string no vacío."

    if not isinstance(payload["symbol"], str) or not payload["symbol"].strip():
        return False, "'symbol' debe ser un string no vacío."

    decimals = payload["decimals"]
    if not isinstance(decimals, int) or decimals < 0 or decimals > 18:
        return False, "'decimals' debe ser un entero entre 0 y 18."

    mint_amount = payload["mint_amount"]

    
    if isinstance(mint_amount, int):
        if mint_amount < 0:
            return False, "'mint_amount' no puede ser negativo."
        mint_amount = str(mint_amount)
        payload["mint_amount"] = mint_amount

    
    if isinstance(mint_amount, float):
        return False, "'mint_amount' no puede ser float. Debe ser uint en string base-10."

    if not isinstance(mint_amount, str) or not _validate_uint_string(mint_amount):
        return (
            False,
            "'mint_amount' debe ser un string numérico (uint) en base 10, "
            "sin separadores (comas/guiones bajos/espacios), sin decimales, sin notación científica (e/E).",
        )

    
    if mint_amount == "0":
        return False, "'mint_amount' no puede ser 0."

    mint_to = payload["mint_to"]
    if not isinstance(mint_to, str) or not _validate_hex_address(mint_to):
        return False, f"Formato inválido de 'mint_to': {mint_to}"

    
    allowed = set(required)
    extra = set(payload.keys()) - allowed
    if extra:
        return False, f"Claves inesperadas: {sorted(extra)}"

    return True, "ok"


class VFTDeployerAgent(BaseAgent):
    name = "vft_deployer"

    async def run(self, req: AgentRequest) -> AgentResponse:
        system_prompt = (
            "Eres un planificador de despliegue de tokens. "
            "DEBES devolver JSON estrictamente válido y nada más. "
            "Sin markdown. Sin explicaciones. "
            "Devuelve UN SOLO objeto JSON con EXACTAMENTE estas claves: "
            "admins (arreglo de strings), name (string), symbol (string), decimals (entero), "
            "mint_amount (string numérico base-10), mint_to (string)."
        )

        user_prompt = f"""
PROMPT DEL USUARIO:
{req.goal}

Devuelve SOLO JSON estricto con este esquema exacto (sin claves extra):

{{
  "admins": ["0x..."],
  "name": "Token Name",
  "symbol": "TKN",
  "decimals": 18,
  "mint_amount": "1000000000000000000000",
  "mint_to": "0x..."
}}

Reglas:
- La salida DEBE ser JSON válido (comillas dobles).
- admins: arreglo con al menos 1 address 0x...
- decimals: entero 0..18
- mint_amount: string numérico base-10 (uint), SOLO dígitos, sin separadores, sin decimales.
- Prohibido usar notación científica (e/E). Ej: "1e18" NO.
- Prohibido usar separadores (comas, guiones bajos, espacios). Ej: "1,000" NO, "1_000" NO.
- Prohibido incluir unidades o texto. Ej: "1000 tokens" NO.
- mint_to: address 0x...
- No incluyas ningún otro campo.
""".strip()

        raw = await asyncio.to_thread(
            self.llm.chat,
            model="gpt-5",
            system=system_prompt,
            user=user_prompt,
            reasoning_effort="high",
        )

        payload = _extract_vft_object(raw)
        if payload is None:
            return AgentResponse(
                agent=self.name,
                summary="El agente devolvió salida no-JSON (no se pudo parsear el payload VFT).",
                result={"ok": False, "raw": raw},
            )

        ok, reason = _validate_vft_payload(payload)
        if not ok:
            return AgentResponse(
                agent=self.name,
                summary=f"Payload VFT inválido: {reason}",
                result={"ok": False, "reason": reason, "payload": payload, "raw": raw},
            )

        return AgentResponse(
            agent=self.name,
            summary="Payload VFT generado para gateway.",
            result={"ok": True, "vft": payload},
        )
