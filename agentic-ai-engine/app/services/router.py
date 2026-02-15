from typing import List, Optional
from app.models.agent_schemas import AgentName

class AgentRouter:
    def route(self, goal: str, preferred: Optional[List[AgentName]] = None) -> List[AgentName]:
        if preferred:
            
            agents = list(dict.fromkeys(preferred + ["economy"]))
            return agents

        g = (goal or "").lower()
        agents: List[AgentName] = []

        if any(k in g for k in [
            "smart program", "smart_program", "algorithm", "optimize", "refactor",
            "bug", "fix", "tests", "unit test", "performance", "design pattern",
            "clean architecture", "best practice", "implement", "build"
        ]):
            agents.append("smart_program")

        if any(k in g for k in ["ui", "frontend", "react", "vue", "css", "component", "screen", "layout"]):
            agents.append("frontend")

        if any(k in g for k in ["api", "backend", "server", "endpoint", "db", "database", "auth", "jwt"]):
            agents.append("server")

        if any(k in g for k in ["rag", "embedding", "index", "vector", "retrieval", "search", "chunk"]):
            agents.append("indexer")

        agents.append("economy")

        if agents == ["economy"]:
            agents = ["smart_program", "economy"]

        # remove duplicates, preserve order
        return list(dict.fromkeys(agents))
