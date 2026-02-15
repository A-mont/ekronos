import httpx
from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException
from app.core.config import settings



DEFAULT_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "agentic-ai-engine",
}

async def exchange_code_for_token(code: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            timeout=30,
        )

    data = r.json()
    token = data.get("access_token")
    if not token:
        raise HTTPException(
            status_code=401,
            detail=data.get("error_description") or "No access_token",
        )
    return token


async def get_github_user(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{settings.GITHUB_API}/user",
            headers={**DEFAULT_HEADERS, "Authorization": f"Bearer {token}"},
            timeout=30,
        )

    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid GitHub token")

    return r.json()


async def fork_repo(token: str, owner: str, repo: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{settings.GITHUB_API}/repos/{owner}/{repo}/forks",
            headers={**DEFAULT_HEADERS, "Authorization": f"Bearer {token}"},
            timeout=30,
        )

    data = r.json() if r.content else {}
    if r.status_code not in (201, 202):
        raise HTTPException(
            status_code=r.status_code,
            detail=data.get("message", "Fork failed"),
        )

    return data or {"status": "accepted"}



@dataclass
class PRSpec:
    owner: str
    repo: str
    head: str
    base: str = "main"
    title: str = ""
    body: Optional[str] = None


def make_branch(username: str, branch: str) -> str:
    return f"{username}:{branch}"


class PRService:
    async def create(self, token: str, spec: PRSpec) -> dict:
        if not spec.title:
            raise HTTPException(status_code=400, detail="Missing PR title")

        payload = {
            "title": spec.title,
            "head": spec.head,
            "base": spec.base,
        }
        if spec.body:
            payload["body"] = spec.body

        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{settings.GITHUB_API}/repos/{spec.owner}/{spec.repo}/pulls",
                headers={**DEFAULT_HEADERS, "Authorization": f"Bearer {token}"},
                json=payload,
                timeout=30,
            )

        data = r.json() if r.content else {}
        if r.status_code not in (200, 201):
            raise HTTPException(
                status_code=r.status_code,
                detail=data.get("message", "Failed to create pull request"),
            )

        return {
            "number": data["number"],
            "html_url": data["html_url"],
            "state": data["state"],
        }
