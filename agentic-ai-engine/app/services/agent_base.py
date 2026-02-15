from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, List

from app.services.llm_client import LLMClient


@dataclass
class AgentRequest:
    trace_id: str
    goal: str
    constraints: List[str]
    context: Dict[str, Any]
    artifacts: Dict[str, Any]


@dataclass
class AgentResponse:
    agent: str
    summary: str
    result: Dict[str, Any]


class BaseAgent(ABC):
    name: str

    def __init__(self, llm: LLMClient):
        self.llm = llm

    @abstractmethod
    async def run(self, req: AgentRequest) -> AgentResponse:
        ...
