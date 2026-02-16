import asyncio
import json
import time
import uuid
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.services.agent_base import AgentRequest

router = APIRouter(prefix="/agents", tags=["agents"])


def get_orchestrator():
    from app.main import orchestrator
    return orchestrator


def sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@router.get("/stream")
async def stream_agents(request: Request, goal: str):
    orch = get_orchestrator()
    trace_id = str(uuid.uuid4())

    targets = orch.router.route(goal)

    started_at = time.time()

    agent_state = {
        name: {
            "status": "queued",   # queued | running | done | error
            "started_at": None,
            "elapsed_s": 0.0,
        }
        for name in targets
    }

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        await queue.put({
            "type": "router_update",
            "trace_id": trace_id,
            "message": "Routing completed",
            "targets": targets,
        })

        async def run_agent(agent_name: str):
            agent = orch.agents[agent_name]

            agent_state[agent_name]["status"] = "running"
            agent_state[agent_name]["started_at"] = time.time()

            await queue.put({
                "type": "agent_start",
                "trace_id": trace_id,
                "agent": agent_name,
            })

            try:
                req = AgentRequest(
                    trace_id=trace_id,
                    goal=goal,
                    constraints=[],
                    context={},
                    artifacts={},
                )

                result = await agent.run(req)

                agent_state[agent_name]["status"] = "done"

                await queue.put({
                    "type": "agent_done",
                    "trace_id": trace_id,
                    "agent": agent_name,
                    "summary": result.summary,
                    "result": result.result,
                })

            except Exception as e:
                agent_state[agent_name]["status"] = "error"

                await queue.put({
                    "type": "agent_error",
                    "trace_id": trace_id,
                    "agent": agent_name,
                    "error": str(e),
                })

    
        async def progress_loop():
            while True:
                if await request.is_disconnected():
                    break

                elapsed = round(time.time() - started_at, 1)

                snapshot = {}
                for name, state in agent_state.items():
                    if state["started_at"]:
                        state["elapsed_s"] = round(time.time() - state["started_at"], 1)

                    snapshot[name] = {
                        "status": state["status"],
                        "elapsed_s": state["elapsed_s"],
                    }

                await queue.put({
                    "type": "progress_tick",
                    "trace_id": trace_id,
                    "elapsed_s": elapsed,
                    "agents": snapshot,
                    "message": f"Working… elapsed {elapsed}s",
                })

                await asyncio.sleep(5)

        # ---- START TASKS
        agent_tasks = [asyncio.create_task(run_agent(a)) for a in targets]
        progress_task = asyncio.create_task(progress_loop())

        remaining = len(agent_tasks)

        try:
            while remaining > 0:
                event = await queue.get()
                yield sse(event)

                if event["type"] in ("agent_done", "agent_error"):
                    remaining -= 1

            yield sse({
                "type": "done",
                "trace_id": trace_id,
            })

        finally:
            progress_task.cancel()
            for t in agent_tasks:
                t.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
