from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.agents import router as agents_router
from app.api.routes.agents_stream import router as agents_stream_router
from app.api.routes.pr import router as pr_router
from app.api.routes.github import router as github_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(agents_router)
api_router.include_router(agents_stream_router)
api_router.include_router(pr_router)
api_router.include_router(github_router)
