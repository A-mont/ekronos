from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse

class FrontendAgent(BaseAgent):
    name = "frontend"

    async def run(self, req: AgentRequest) -> AgentResponse:
        output = self.llm.chat(
            model="gpt-5.1",
            system="You are a frontend React and UX expert.",
            user=req.goal
        )

        return AgentResponse(
            agent=self.name,
            summary="Frontend UI design",
            result={"ui_design": output}
        )
