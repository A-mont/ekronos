from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse

class EconomyAgent(BaseAgent):
    name = "economy"

    async def run(self, req: AgentRequest) -> AgentResponse:
        output = self.llm.chat(
            model="gpt-5",
            reasoning_effort="low",
            system="You optimize AI cost and efficiency.",
            user=req.goal
        )

        return AgentResponse(
            agent=self.name,
            summary="Cost optimization analysis",
            result={"recommendations": output}
        )
