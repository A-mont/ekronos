from fastapi import APIRouter, Request, HTTPException
import httpx
import re
import uuid

from app.models.agent_schemas import RunAgentsRequest, RunAgentsResponse
from app.services.agent_base import AgentRequest

router = APIRouter(prefix="/agents", tags=["agents"])


def get_orchestrator():
    from app.main import orchestrator
    return orchestrator


def _is_hex(addr: str) -> bool:
    return bool(re.fullmatch(r"0x[0-9a-fA-F]{2,}", (addr or "").strip()))


@router.post("/run", response_model=RunAgentsResponse)
async def run_agents(request: RunAgentsRequest):
    orch = get_orchestrator()
    return await orch.run(
        goal=request.goal,
        constraints=request.constraints,
        context=request.context,
        preferred_agents=request.preferred_agents,
    )


@router.post("/run-and-send", response_model=RunAgentsResponse)
async def run_agents_and_send(request: RunAgentsRequest, req: Request):
    orch = get_orchestrator()

    run_result = await orch.run(
        goal=request.goal,
        constraints=request.constraints,
        context=request.context,
        preferred_agents=request.preferred_agents,
    )

    vft = (
        run_result.artifacts
        .get("vft_deployer", {})
        .get("vft")
    )

    if not vft or not isinstance(vft, dict):
        raise HTTPException(status_code=400, detail="Missing VFT payload from vft_deployer")

    
    mint_amount = vft.get("mint_amount")

    if isinstance(mint_amount, int):
        vft["mint_amount"] = str(mint_amount)
    elif isinstance(mint_amount, str):
        if not mint_amount.isdigit():
            raise HTTPException(
                status_code=400,
                detail="Invalid mint_amount: must be digits-only base10 string.",
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid mint_amount type: must be digits-only string or int.",
        )

    gateway_url = req.app.state.gateway_url

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            gw_resp = await client.post(
                gateway_url,
                json=vft,
                headers={"Accept": "application/json"},
            )

            if gw_resp.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail=f"Gateway error: HTTP {gw_resp.status_code} body={gw_resp.text}",
                )

        try:
            gw_json = gw_resp.json()
        except Exception:
            gw_json = {"raw": gw_resp.text}

        run_result.artifacts["gateway"] = {
            "ok": True,
            "request_sent": vft,
            "status_code": gw_resp.status_code,
            "response": gw_json,
        }

    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {str(e)}")

    return run_result


@router.post("/liquidity/run-and-send")
async def liquidity_run_and_send(req: Request):
    """
    Isolated Liquidity endpoint.

    Input:
    {
      "token": "0x..."
    }

    Sends to gateway:
    {
      "token": "0x...",
      "registered_token": null
    }
    """
    body = await req.json()
    token = body.get("token")
    context = body.get("context") or {}

    if not isinstance(token, str) or not _is_hex(token):
        raise HTTPException(
            status_code=400,
            detail="Invalid token format. Expected 0x... hex string.",
        )

    gateway_liquidity_url = getattr(req.app.state, "gateway_liquidity_url", None)
    if not gateway_liquidity_url:
        raise HTTPException(
            status_code=500,
            detail="gateway_liquidity_url is not configured in app.state",
        )

    orch = get_orchestrator()

    
    ctx = dict(context) if isinstance(context, dict) else {}
    ctx["token"] = token

    agent_req = AgentRequest(
        trace_id=str(uuid.uuid4()),
        goal=f"Register liquidity for token {token}",
        constraints=None,
        context=ctx,
        artifacts={},
    )

    liq_resp = await orch.agents["liquidity"].run(agent_req)

    liq_payload = (liq_resp.result or {}).get("liquidity")
    if not isinstance(liq_payload, dict):
        raise HTTPException(
            status_code=500,
            detail="LiquidityAgent did not return liquidity payload",
        )

    if set(liq_payload.keys()) != {"token", "registered_token"}:
        raise HTTPException(
            status_code=500,
            detail="Liquidity payload must have exactly: token, registered_token",
        )

    liq_payload["token"] = token

    print(gateway_liquidity_url,liq_payload)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            gw_resp = await client.post(
                gateway_liquidity_url,
                json=liq_payload,
                headers={"Accept": "application/json"},
            )

            if gw_resp.status_code >= 400:
                raise HTTPException(
                    status_code=502,
                    detail=f"Gateway error: HTTP {gw_resp.status_code} body={gw_resp.text}",
                )

        try:
            gw_json = gw_resp.json()
        except Exception:
            gw_json = {"raw": gw_resp.text}

    except HTTPException:
        raise
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Gateway error: {str(e)}")

    registered_token = None
    if isinstance(gw_json, dict):
        rt = (gw_json.get("data") or {}).get("registered_token")
        if isinstance(rt, str) and _is_hex(rt):
            registered_token = rt

    return {
        "ok": True,
        "token": token,
        "registered_token": registered_token,
        "agent": {
            "summary": liq_resp.summary,
            "payload_sent": liq_payload,
        },
        "gateway": gw_json,
    }
