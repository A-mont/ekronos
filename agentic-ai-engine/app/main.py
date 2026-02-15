from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.services.llm_client import LLMClient
from app.services.router import AgentRouter
from app.services.orchestrator import Orchestrator
from app.services.agents import (
    SmartProgramAgent,
    EconomyAgent,
    ServerAgent,
    FrontendAgent,
    IndexerAgent,
)

app = FastAPI(title="Agentic AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


llm = LLMClient()
router = AgentRouter()

agents = {
    "smart_program": SmartProgramAgent(llm),
    "economy": EconomyAgent(llm),
    "server": ServerAgent(llm),
    "frontend": FrontendAgent(llm),
    "indexer": IndexerAgent(llm),
}

orchestrator = Orchestrator(agents, router)

app.include_router(api_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
