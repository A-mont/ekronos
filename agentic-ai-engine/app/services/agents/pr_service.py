from __future__ import annotations

import os
import subprocess
import time
import json
import urllib.request
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class PRSpec:
    branch: str
    title: str
    body: str
    base: str = "main"


class PRService:
    """
    Creates a PR by:
    - creating a git branch
    - writing files into the repo working tree
    - committing + pushing
    - opening a GitHub PR via REST API
    """

    def __init__(self, repo_dir: str):
        self.repo_dir = os.path.abspath(repo_dir)

        self.token = os.getenv("GITHUB_TOKEN")
        self.owner = os.getenv("GITHUB_OWNER")
        self.repo = os.getenv("GITHUB_REPO")

        if not self.token or not self.owner or not self.repo:
            raise RuntimeError("Missing GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO env vars")

    def _run(self, *args: str) -> str:
        p = subprocess.run(
            list(args),
            cwd=self.repo_dir,
            check=True,
            capture_output=True,
            text=True,
        )
        return (p.stdout or "").strip()

    def _write_files(self, files: Dict[str, str]) -> None:
        for rel_path, content in files.items():
            abs_path = os.path.join(self.repo_dir, rel_path)
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            with open(abs_path, "w", encoding="utf-8") as f:
                f.write(content)

    def _github_create_pr(self, spec: PRSpec) -> str:
        url = f"https://api.github.com/repos/{self.owner}/{self.repo}/pulls"
        payload = {
            "title": spec.title,
            "head": spec.branch,
            "base": spec.base,
            "body": spec.body,
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Authorization", f"token {self.token}")
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("Content-Type", "application/json")

        with urllib.request.urlopen(req) as resp:
            out = json.loads(resp.read().decode("utf-8"))
            return out["html_url"]

    def create_pr(self, spec: PRSpec, files: Dict[str, str], commit_message: Optional[str] = None) -> str:
        # Ensure clean-ish working tree (optional: you can enforce clean)
        # self._run("git", "status", "--porcelain")

        # Checkout base and pull latest
        self._run("git", "checkout", spec.base)
        try:
            self._run("git", "pull", "--rebase")
        except Exception:
            # non-fatal in some envs
            pass

        # Create new branch
        self._run("git", "checkout", "-b", spec.branch)

        # Write files
        self._write_files(files)

        # Commit
        self._run("git", "add", ".")
        if commit_message is None:
            commit_message = spec.title

        env = os.environ.copy()
        env.setdefault("GIT_AUTHOR_NAME", os.getenv("GIT_AUTHOR_NAME", "agent-bot"))
        env.setdefault("GIT_AUTHOR_EMAIL", os.getenv("GIT_AUTHOR_EMAIL", "agent-bot@example.com"))
        env.setdefault("GIT_COMMITTER_NAME", env["GIT_AUTHOR_NAME"])
        env.setdefault("GIT_COMMITTER_EMAIL", env["GIT_AUTHOR_EMAIL"])

        subprocess.run(
            ["git", "commit", "-m", commit_message],
            cwd=self.repo_dir,
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )

        # Push
        self._run("git", "push", "-u", "origin", spec.branch)

        # Open PR
        pr_url = self._github_create_pr(spec)
        return pr_url


def make_branch(prefix: str = "agent") -> str:
    ts = time.strftime("%Y%m%d-%H%M%S")
    return f"{prefix}/{ts}"
