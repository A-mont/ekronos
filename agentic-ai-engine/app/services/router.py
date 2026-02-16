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
            "smart program", "smart_program", "contract", "smart contract", "program",
            "algorithm", "optimize", "refactor", "bug", "fix", "tests", "unit test",
            "performance", "design pattern", "clean architecture", "best practice",
            "implement", "build", "rust", "gear", "vara", "sails"
        ]):
            agents.append("smart_program")

        # --- Frontend agent ---
        if any(k in g for k in [
            "ui", "frontend", "react", "vue", "css", "component", "screen", "layout",
            "dashboard", "chart", "charts", "recharts", "tailwind", "responsive"
        ]):
            agents.append("frontend")

        # --- Server agent ---
        if any(k in g for k in [
            "api", "backend", "server", "endpoint", "fastapi", "db", "database",
            "auth", "jwt", "cors", "middleware", "schema", "pydantic", "webhook"
        ]):
            agents.append("server")

        # --- Indexer agent is now Risk Agent ---
        risk_keywords = [
            # Core risk terms
            "risk", "risks", "risk analysis", "risk assessment", "risk management",
            "threat", "threats", "vulnerability", "vulnerabilities", "attack", "attacks",
            "exploit", "exploits", "security", "audit", "auditing", "incident",
            "mitigation", "mitigations", "exposure", "risk score", "risk scoring",

            # DeFi / market risk
            "market risk", "volatility", "drawdown", "liquidity risk", "liquidity",
            "slippage", "impermanent loss", "il", "depeg", "peg risk", "oracle risk",
            "price manipulation", "front running", "mev", "sandwich", "wash trading",

            # Protocol / technical risk
            "technical risk", "smart contract risk", "bug bounty", "dependency risk",
            "upgrade risk", "admin key risk", "privileged", "centralization risk",
            "governance risk", "governance attack", "treasury risk",

            # Regulatory / compliance risk
            "regulatory", "compliance", "legal", "sanctions", "kyc", "aml",

            # Trend / monitoring / analytics language
            "trend", "trends", "signal", "signals", "indicator", "indicators",
            "sentiment", "market sentiment", "correlation", "macro", "stress test",
            "scenario", "scenarios", "tail risk", "early warning", "monitoring",
            "risk dashboard", "heatmap"
        ]

        # Keep backwards compatibility with old indexer keywords too
        legacy_indexer_keywords = ["rag", "embedding", "index", "vector", "retrieval", "search", "chunk"]

        if any(k in g for k in risk_keywords) or any(k in g for k in legacy_indexer_keywords):
            agents.append("indexer")

    
        tokenomics_keywords = [
            "tokenomics", "distribution", "allocation", "vesting", "unlock",
            "emissions", "inflation", "supply", "circulating", "total supply",
            "staking", "rewards", "incentives", "treasury", "airdrop"
        ]
        if any(k in g for k in tokenomics_keywords):
            agents.append("economy")
        else:
            
            agents.append("economy")

       
        if agents == ["economy"]:
            agents = ["smart_program", "economy"]

       
        return list(dict.fromkeys(agents))
