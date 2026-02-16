from openai import OpenAI
from app.core.config import settings

class LLMClient:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not set")

        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def chat(
        self,
        *,
        model: str,
        system: str,
        user: str,
        reasoning_effort: str | None = None
    ) -> str:
        kwargs = {
            "model": model,
            "instructions": system,
            "input": user,
        }

        if reasoning_effort is not None:
            kwargs["reasoning"] = {"effort": reasoning_effort}

        response = self.client.responses.create(**kwargs)
        return response.output_text
