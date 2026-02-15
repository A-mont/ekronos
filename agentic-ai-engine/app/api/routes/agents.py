from fastapi import APIRouter
from app.models.agent_schemas import RunAgentsRequest, RunAgentsResponse

router = APIRouter(prefix="/agents", tags=["agents"])

def get_orchestrator():
    from app.main import orchestrator
    return orchestrator

@router.post("/run", response_model=RunAgentsResponse)
async def run_agents(request: RunAgentsRequest):
    orch = get_orchestrator()
    return await orch.run(
        goal=request.goal,
        constraints=request.constraints,
        context=request.context,
        preferred_agents=request.preferred_agents
    )
