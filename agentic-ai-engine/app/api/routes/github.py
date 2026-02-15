import secrets
import json
import base64
import httpx

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.security import create_session, get_token_from_request
from app.services.pr_service import (
    exchange_code_for_token,
    get_github_user,
    fork_repo,
    PRService,
    PRSpec,
)

router = APIRouter(prefix="/api", tags=["github"])


@router.get("/auth/github/start")
async def github_start():
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Missing GITHUB_CLIENT_ID")

    state = secrets.token_urlsafe(16)
    redirect_uri = f"{settings.BACKEND_URL}/api/auth/github/callback"
    scope = "public_repo"  # o "repo"

    url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={scope}"
        f"&state={state}"
    )
    return RedirectResponse(url)


@router.get("/auth/github/callback")
async def github_callback(code: str):
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    if not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Missing GITHUB_CLIENT_SECRET")

    access_token = await exchange_code_for_token(code)
    signed_session = create_session(access_token)

    resp = RedirectResponse(settings.FRONTEND_URL)
    resp.set_cookie(
        key=settings.SESSION_COOKIE,
        value=signed_session,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=60 * 60 * 24,
    )
    return resp


@router.get("/me")
async def me(request: Request):
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    data = await get_github_user(token)
    return {"login": data["login"]}


@router.post("/github/fork")
async def fork(request: Request):
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    owner = settings.TARGET_REPO_OWNER
    repo = settings.TARGET_REPO_NAME

    data = await fork_repo(token, owner, repo)
    return {
        "owner": owner,
        "repo": repo,
        "full_name": data.get("full_name"),
        "html_url": data.get("html_url"),
    }


def _maybe_json_load(x):
    """Si x es str con JSON, intenta parsearlo; si no, retorna x."""
    if isinstance(x, str):
        s = x.strip()
        if (s.startswith("{") and s.endswith("}")) or (s.startswith("[") and s.endswith("]")):
            try:
                return json.loads(s)
            except Exception:
                return x
    return x


def _normalize_files(files_obj) -> dict:
    """
    Normaliza files para soportar:
      - dict: { "path": "content" } o { "path": { "content": "..." } }
      - list: [ { "path": "...", "content": "..." }, ... ]
      - string JSON: "{...}" o "[...]"
    Retorna dict {path: content}.
    """
    files_obj = _maybe_json_load(files_obj)

    if files_obj is None:
        return {}

    if isinstance(files_obj, dict):
        out = {}
        for k, v in files_obj.items():
            if isinstance(v, str):
                out[k] = v
            elif isinstance(v, dict) and isinstance(v.get("content"), str):
                out[k] = v["content"]
        return out

    if isinstance(files_obj, list):
        out = {}
        for item in files_obj:
            if not isinstance(item, dict):
                continue
            path = item.get("path") or item.get("file") or item.get("name")
            content = item.get("content")
            if isinstance(path, str) and isinstance(content, str):
                out[path] = content
        return out

    return {}


def _choose_target_path(files_dict: dict) -> str:
    """
    Decide QUÉ archivo en el repo actualizar.
    Reglas:
      1) Si el payload trae exactamente "app/src/services/service.rs" úsalo.
      2) Si trae algún "*service.rs" (ej: counter/src/service.rs), usa ese path (primer match).
      3) Fallback: app/src/services/service.rs
    """
    if not isinstance(files_dict, dict) or not files_dict:
        return "app/src/services/service.rs"

    if "app/src/services/service.rs" in files_dict:
        return "app/src/services/service.rs"

    for k in files_dict.keys():
        if isinstance(k, str) and k.endswith("/service.rs"):
            return k

    # Fallback
    return "app/src/services/service.rs"


def _pick_content_for_path(files_dict: dict, target_path: str) -> str | None:
   
    if not isinstance(files_dict, dict) or not files_dict:
        return None

    v = files_dict.get(target_path)
    if isinstance(v, str) and v.strip():
        return v

    for k, v in files_dict.items():
        if isinstance(k, str) and k.endswith("service.rs") and isinstance(v, str) and v.strip():
            return v

    for v in files_dict.values():
        if isinstance(v, str) and v.strip():
            return v

    return None


@router.post("/pr")
async def create_pr(request: Request, payload: dict):
    
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    payload = _maybe_json_load(payload)
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid JSON payload")


    pr_obj = payload.get("pr")
    pr_obj = _maybe_json_load(pr_obj) if pr_obj is not None else None

    if isinstance(pr_obj, dict):
        title = pr_obj.get("title")
        body = pr_obj.get("body", "")
        base_branch = pr_obj.get("base") or getattr(settings, "PR_BASE_BRANCH", None) or "main"
        new_branch = pr_obj.get("branch") or getattr(settings, "PR_HEAD_BRANCH", None) or "feature/auto-pr"
        files_dict = _normalize_files(payload.get("files"))
        file_content_fallback = payload.get("file_content")
    else:
        title = payload.get("title")
        body = payload.get("body", "")
        base_branch = payload.get("base") or getattr(settings, "PR_BASE_BRANCH", None) or "main"
        new_branch = payload.get("branch") or getattr(settings, "PR_HEAD_BRANCH", None) or "feature/auto-pr"
        files_dict = _normalize_files(payload.get("files"))
        file_content_fallback = payload.get("file_content")

    if not title:
        raise HTTPException(status_code=400, detail="Missing title (or pr.title)")

    
    target_path = _choose_target_path(files_dict)
    new_text = _pick_content_for_path(files_dict, target_path)

    if not new_text and isinstance(file_content_fallback, str) and file_content_fallback.strip():
        new_text = file_content_fallback

    if not new_text:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "No file content provided. Send payload.files with at least one file string OR payload.file_content.",
                "received_keys": list(payload.keys()),
                "files_type": type(payload.get("files")).__name__ if "files" in payload else None,
            },
        )

    upstream_repo = settings.TARGET_REPO_NAME

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "agentic-ai-engine",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        
        me = await get_github_user(token)
        fork_owner = me["login"]
        fork_repo_name = upstream_repo

        
        ref_url = f"https://api.github.com/repos/{fork_owner}/{fork_repo_name}/git/ref/heads/{base_branch}"
        ref_res = await client.get(ref_url, headers=headers)
        if ref_res.status_code != 200:
            detail = ref_res.json() if ref_res.content else {"message": "unknown"}
            raise HTTPException(status_code=500, detail=f"Failed to read base branch SHA: {detail.get('message')}")

        base_sha = ref_res.json()["object"]["sha"]

       
        create_ref_url = f"https://api.github.com/repos/{fork_owner}/{fork_repo_name}/git/refs"
        create_ref_res = await client.post(
            create_ref_url,
            headers=headers,
            json={"ref": f"refs/heads/{new_branch}", "sha": base_sha},
        )
       
        if create_ref_res.status_code not in (201, 422):
            detail = create_ref_res.json() if create_ref_res.content else {"message": "unknown"}
            raise HTTPException(status_code=500, detail=f"Failed to create branch: {detail.get('message')}")

       
        contents_url = f"https://api.github.com/repos/{fork_owner}/{fork_repo_name}/contents/{target_path}"

    
        get_file_res = await client.get(contents_url, headers=headers, params={"ref": new_branch})
        existing_sha = None
        if get_file_res.status_code == 200:
            existing_sha = get_file_res.json().get("sha")
        elif get_file_res.status_code == 404:
            existing_sha = None
        else:
            detail = get_file_res.json() if get_file_res.content else {"message": "unknown"}
            raise HTTPException(status_code=500, detail=f"Failed to read target file: {detail.get('message')}")

        b64_content = base64.b64encode(new_text.encode("utf-8")).decode("utf-8")

        commit_payload = {
            "message": f"chore: update {target_path}",
            "content": b64_content,
            "branch": new_branch,
        }
        if existing_sha:
            commit_payload["sha"] = existing_sha

        put_res = await client.put(contents_url, headers=headers, json=commit_payload)
        if put_res.status_code not in (200, 201):
            detail = put_res.json() if put_res.content else {"message": "unknown"}
            raise HTTPException(status_code=500, detail=f"Failed to create commit: {detail.get('message')}")

        spec = PRSpec(
            owner=fork_owner,
            repo=fork_repo_name,
            head=new_branch,
            base=base_branch,
            title=title,
            body=body,
        )
        service = PRService()
        return await service.create(token, spec)
