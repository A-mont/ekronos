from app.services.agent_base import BaseAgent, AgentRequest, AgentResponse

class IndexerAgent(BaseAgent):
    name = "indexer"

    async def run(self, req: AgentRequest) -> AgentResponse:
        output = self.llm.chat(
            model="gpt-4.1",
            reasoning_effort="medium",
            system="You design RAG and vector indexing systems.",
            user=req.goal
        )

        return AgentResponse(
            agent=self.name,
            summary="RAG pipeline design",
            result={"pipeline": output}
        )
