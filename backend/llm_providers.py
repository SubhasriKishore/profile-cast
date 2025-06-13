# from langchain_huggingface import HuggingFaceEndpoint  # Removed, not needed
import openai
import os
from typing import Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Debug: Print all environment variables
print("Environment variables:")
print(f"LLM_PROVIDER: {os.getenv('LLM_PROVIDER')}")
print(f"OPENAI_API_KEY exists: {bool(os.getenv('OPENAI_API_KEY'))}")

class OpenAIClient:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY must be set in environment variables.")
        self.model = os.getenv("LLM_MODEL", "gpt-4")
        self.temperature = float(os.getenv("MODEL_TEMPERATURE", 0.7))
        self.max_tokens = int(os.getenv("MODEL_MAX_TOKENS", 512))
        self.top_p = float(os.getenv("MODEL_TOP_P", 0.95))
        self.client = openai.OpenAI(api_key=self.api_key)

    def invoke(self, prompt: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": prompt}],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            top_p=self.top_p,
        )
        return response.choices[0].message.content

def get_llm_client():
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    if provider == "openai":
        return OpenAIClient()
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")