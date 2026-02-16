from fastapi import APIRouter

from app.api.routes.agents import router as agents_router
from app.api.routes.agents_stream import router as agents_stream_router
from app.api.routes.health import router as health_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(agents_router)
api_router.include_router(agents_stream_router)
