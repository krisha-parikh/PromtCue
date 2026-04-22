import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

def get_groq_client(api_key: str | None = None) -> Groq:
    final_key = api_key or os.getenv("GROQ_API_KEY")

    print("DEBUG env key exists:", bool(os.getenv("GROQ_API_KEY")))
    print("DEBUG final key exists:", bool(final_key))
    print("DEBUG key prefix:", final_key[:8] if final_key else None)

    if not final_key:
        raise ValueError("Groq API key is missing.")

    return Groq(api_key=final_key)


def test_api_key(api_key: str) -> bool:
    client = get_groq_client(api_key)
    client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": "Reply with OK"}],
        max_tokens=5,
    )
    return True