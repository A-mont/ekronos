from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse
from app.utils.utils import load_training_files

class ServerAgent(BaseAgent):
    name = "server"

    async def run(self, req: AgentRequest) -> AgentResponse:
        output = self.llm.chat(
            model="gpt-5.1",
            system="You are a backend engineer specialized in APIs.",
            user=req.goal
        )

        return AgentResponse(
            agent=self.name,
            summary="Backend API design",
            result={"backend_design": output}
        )
