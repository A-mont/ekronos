from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime

AgentName = Literal[
    "smart_program",
    "frontend",
    "server",
    "indexer",
    "economy"
]

class RunAgentsRequest(BaseModel):
    goal: str
    constraints: List[str] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)
    preferred_agents: Optional[List[AgentName]] = None

class AgentStep(BaseModel):
    agent: AgentName
    summary: str
    result: Dict[str, Any]

class RunAgentsResponse(BaseModel):
    trace_id: str
    started_at: datetime
    finished_at: datetime
    targets: List[AgentName]
    steps: List[AgentStep]
    artifacts: Dict[str, Any]
    context: Dict[str, Any]
