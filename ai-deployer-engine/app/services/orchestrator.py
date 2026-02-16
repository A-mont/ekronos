import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, List

from app.services.agent_base import AgentRequest
from app.models.agent_schemas import AgentStep, RunAgentsResponse, AgentName
from app.services.router import AgentRouter

class Orchestrator:
    def __init__(self, agents: Dict[AgentName, Any], router: AgentRouter):
        self.agents = agents
        self.router = router

    async def _run_agent(self, agent, req: AgentRequest):
        return await agent.run(req)

    async def run(self, goal, constraints, context, preferred_agents):
        trace_id = str(uuid.uuid4())
        started_at = datetime.utcnow()

        artifacts: Dict[str, Any] = {}
        steps: List[AgentStep] = []

        targets = self.router.route(goal, preferred_agents)

        req = AgentRequest(
            trace_id=trace_id,
            goal=goal,
            constraints=constraints,
            context=context,
            artifacts=artifacts
        )

        tasks = [
            self._run_agent(self.agents[name], req)
            for name in targets
        ]

        responses = await asyncio.gather(*tasks)

        for response in responses:
            steps.append(
                AgentStep(
                    agent=response.agent,
                    summary=response.summary,
                    result=response.result
                )
            )
            artifacts[response.agent] = response.result
            req.context.setdefault("agent_summaries", []).append(
                {response.agent: response.summary}
            )

        finished_at = datetime.utcnow()

        return RunAgentsResponse(
            trace_id=trace_id,
            started_at=started_at,
            finished_at=finished_at,
            targets=targets,
            steps=steps,
            artifacts=artifacts,
            context=req.context
        )
