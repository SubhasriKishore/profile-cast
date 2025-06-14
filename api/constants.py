"""
Constants for the backend application.
"""

# LLM Configuration
LLM_CONFIG = {
    "provider": "huggingface",
    "model": "google/flan-t5-base",
    "temperature": 0.7,
    "max_tokens": 256,
    "top_p": 0.95,
    "top_k": 50,
    "task": "text-generation"
}

# Audio Configuration
AUDIO_CONFIG = {
    "sample_rate": 16000,
    "channels": 1
}

# CastingFit Configuration
CASTINGFIT_CONFIG = {
    "num_questions": 5,
    "duration_minutes": 10
}

# API Endpoints
API_ENDPOINTS = {
    "speech_to_text": "https://api.vapi.ai/v1/speech-to-text",
    "text_to_speech": "https://api.vapi.ai/v1/text-to-speech",
    "call_feedback": "https://api.vapi.ai/call"
} 