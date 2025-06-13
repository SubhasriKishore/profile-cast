import os
from dotenv import load_dotenv

class Config:
    def __init__(self):
        load_dotenv()
        
        # LLM Configuration
        self.llm_provider = os.getenv("LLM_PROVIDER", "huggingface")
        self.llm_model = os.getenv("LLM_MODEL", "google/flan-t5-base")
        self.model_temperature = float(os.getenv("MODEL_TEMPERATURE", "0.7"))
        self.model_max_tokens = int(os.getenv("MODEL_MAX_TOKENS", "256"))
        self.model_top_p = float(os.getenv("MODEL_TOP_P", "0.95"))
        self.model_top_k = int(os.getenv("MODEL_TOP_K", "50"))
        self.model_task = os.getenv("MODEL_TASK", "text-generation")
        
        # API Keys
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        self.ai21_api_key = os.getenv("AI21_API_KEY")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.vapi_api_key = os.getenv("VAPI_BE_API_KEY")
        
        # Proxy Configuration
        self.proxy_base_url = os.getenv("PROXY_BASE_URL", "http://localhost:3040/v1")
        
        # Audio Configuration
        self.audio_sample_rate = int(os.getenv("AUDIO_SAMPLE_RATE", "16000"))
        self.audio_channels = int(os.getenv("AUDIO_CHANNELS", "1"))
        
        # CastingFit Configuration
        self.CastingFit_num_questions = int(os.getenv("CastingFit_NUM_QUESTIONS", "5"))
        self.CastingFit_duration_minutes = int(os.getenv("CastingFit_DURATION_MINUTES", "10"))
        
    def validate(self):
        """Validate the configuration"""
        required_keys = {
            "huggingface": ["HUGGINGFACE_API_KEY"],
            "openai": ["OPENAI_API_KEY"],
            "anthropic": ["ANTHROPIC_API_KEY"],
            "cohere": ["COHERE_API_KEY"],
            "ai21": ["AI21_API_KEY"],
            "gemini": ["GEMINI_API_KEY"],
            "proxy": [],  # No API key required for proxy
            "tavily": ["TAVILY_API_KEY"]
        }
        
        if self.llm_provider not in required_keys:
            raise ValueError(f"Unsupported LLM provider: {self.llm_provider}")
            
        for key in required_keys[self.llm_provider]:
            if not getattr(self, key.lower()):
                raise ValueError(f"Missing required API key: {key}")
                
        # Validate VAPI API key
        if not self.vapi_api_key:
            raise ValueError("Missing required API key: VAPI_API_KEY") 