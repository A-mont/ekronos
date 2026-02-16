from typing import List, Optional
from app.models.agent_schemas import AgentName


class AgentRouter:
    """
    Routing rules (SEQUENTIAL, ORDERED):
    1. vft_deployer always runs first when token deployment is implied.
    2. liquidity runs only if pool/liquidity intent is detected.
    """

    def route(
        self,
        goal: str,
        preferred: Optional[List[AgentName]] = None,
    ) -> List[AgentName]:

        if preferred:
            ordered: List[AgentName] = []
            if "vft_deployer" in preferred:
                ordered.append("vft_deployer")
            if "liquidity" in preferred:
                ordered.append("liquidity")
            return ordered

        g = (goal or "").lower()

        targets: List[AgentName] = []

        vft_keywords = [
            "token",
            "vft",
            "fungible",
            "deploy token",
            "create token",
            "mint",
            "erc20",
            "asset",
            "symbol",
            "decimals",
            "supply",
        ]

        wants_vft = any(k in g for k in vft_keywords)

      
        liquidity_keywords = [
            "liquidity",
            "pool",
            "amm",
            "dex",
            "swap",
            "pair",
            "price",
            "seed",
            "initial liquidity",
        ]

        wants_liquidity = any(k in g for k in liquidity_keywords)

        if wants_vft:
            targets.append("vft_deployer")

        if wants_liquidity:
            if "vft_deployer" not in targets:
                targets.append("vft_deployer")
            targets.append("liquidity")

        if not targets:
            targets = ["vft_deployer"]

        return targets
