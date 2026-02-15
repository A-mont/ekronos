import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "agentic-ai-engine"
    ENV: str = os.getenv("ENV", "dev")

    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-5")

    GITHUB_CLIENT_ID: str = os.getenv("GITHUB_CLIENT_ID", "")
    GITHUB_CLIENT_SECRET: str = os.getenv("GITHUB_CLIENT_SECRET", "")

    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    TARGET_REPO_OWNER: str = os.getenv("TARGET_REPO_OWNER", "octocat")
    TARGET_REPO_NAME: str = os.getenv("TARGET_REPO_NAME", "Hello-World")

    COOKIE_SECRET: str = os.getenv("COOKIE_SECRET", "secret")
    SESSION_COOKIE: str = os.getenv("SESSION_COOKIE", "sid")

    # En prod (https)
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false").lower() == "true"

    GITHUB_API: str = "https://api.github.com"


settings = Settings()
