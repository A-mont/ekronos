import secrets
from typing import Optional

from fastapi import Request
from itsdangerous import URLSafeSerializer, BadSignature

from app.core.config import settings

serializer = URLSafeSerializer(settings.COOKIE_SECRET, salt="gh-oauth")

# En prod: Redis/DB.
token_store: dict[str, str] = {}

def create_session(access_token: str) -> str:
    session_id = secrets.token_urlsafe(24)
    token_store[session_id] = access_token
    return serializer.dumps(session_id)

def get_token_from_request(req: Request) -> Optional[str]:
    sid = req.cookies.get(settings.SESSION_COOKIE)
    if not sid:
        return None
    try:
        session_id = serializer.loads(sid)
    except BadSignature:
        return None
    return token_store.get(session_id)
