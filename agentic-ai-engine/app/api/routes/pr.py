from __future__ import annotations

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

from app.services.pr_service import PRService, PRSpec, make_branch

router = APIRouter(prefix="/pr", tags=["pr"])


class CreatePRRequest(BaseModel):
    title: str
    body: str
    base: str = "main"
    branch: Optional[str] = None
    files: Dict[str, str]


@router.post("/create")
async def create_pr(req: CreatePRRequest):
    repo_dir = os.getenv("REPO_DIR", os.path.abspath(os.getcwd()))
    try:
        svc = PRService(repo_dir=repo_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    branch = req.branch or make_branch("agent")
    spec = PRSpec(branch=branch, title=req.title, body=req.body, base=req.base)

    try:
        pr_url = svc.create_pr(spec=spec, files=req.files, commit_message=req.title)
        return {"ok": True, "pr_url": pr_url, "branch": branch}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create PR: {str(e)}")
