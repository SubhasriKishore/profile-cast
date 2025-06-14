import os
from dotenv import load_dotenv
from constants import LLM_CONFIG, AUDIO_CONFIG, CASTINGFIT_CONFIG

class Config:
    def __init__(self):
        load_dotenv()
        
        # Load configurations from constants
        self.llm_config = LLM_CONFIG
        self.audio_config = AUDIO_CONFIG
        self.castingfit_config = CASTINGFIT_CONFIG
        
        # API Keys (from environment variables)
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.vapi_api_key = os.getenv("VAPI_BE_API_KEY")
        
    def validate(self):
        """Validate the configuration"""
        # Validate required API keys
        if not self.openai_api_key:
            raise ValueError("Missing required API key: OPENAI_API_KEY")
        if not self.tavily_api_key:
            raise ValueError("Missing required API key: TAVILY_API_KEY")
        if not self.vapi_api_key:
            raise ValueError("Missing required API key: VAPI_BE_API_KEY") 