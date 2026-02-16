from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api import api_router
from app.services.llm_client import LLMClient
from app.services.router import AgentRouter
from app.services.orchestrator import Orchestrator
from app.services.agents import LiquidityAgent, VFTDeployerAgent

app = FastAPI(title="Agentic AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.gateway_url = os.getenv("GATEWAY_URL", "http://localhost:9000")
app.state.gateway_liquidity_url = os.getenv("GATEWAY_LIQUIDITY_URL", "http://localhost:9000")

# Shared dependencies
llm = LLMClient()
router = AgentRouter()

# ✅ Register both agents (instances receive llm)
agents = {
    "liquidity": LiquidityAgent(llm),
    "vft_deployer": VFTDeployerAgent(llm),
}

# Orchestrator gets the registry + router
orchestrator = Orchestrator(agents, router)

# If your api_router needs orchestrator, expose it (optional pattern)
app.state.orchestrator = orchestrator

app.include_router(api_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
