"""
Constants for the backend application.
"""
import os

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
    "speech_to_text": os.getenv("VAPI_SPEECH_TO_TEXT_URL", "https://api.vapi.ai/v1/speech-to-text"),
    "text_to_speech": os.getenv("VAPI_TEXT_TO_SPEECH_URL", "https://api.vapi.ai/v1/text-to-speech"),
    "call_feedback": os.getenv("VAPI_CALL_FEEDBACK_URL", "https://api.vapi.ai/call")
} 