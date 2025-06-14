from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel, Field
import os
import logging
import sys
from modules.ai_castingfit.castingfit_service import CastingFitService
from modules.profile_cast_aid.profile_service import ProfileService
from config import Config
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load configuration
config = Config()
VAPI_API_KEY = os.getenv("VAPI_BE_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# Initialize services
CastingFit_service = CastingFitService(VAPI_API_KEY)
profile_service = ProfileService(TAVILY_API_KEY)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Input validation models
class ProfileRequest(BaseModel):
    requirements: str = Field(..., min_length=10, max_length=1000)
    file: UploadFile = Field(..., description="PDF file")

class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)

@app.post("/api/parse-profile")
@limiter.limit("10/minute")
async def parse_profile(request: Request, requirements: str = Form(...), file: UploadFile = File(...)):
    """Parse and analyze a candidate's profile."""
    try:
        return await profile_service.parse_profile(requirements, file)
    except Exception as e:
        logger.error(f"Error in parse_profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/speech-to-text")
@limiter.limit("30/minute")
async def speech_to_text_vapi(request: Request, file: UploadFile = File(...)):
    """Convert speech to text using VAPI."""
    try:
        return await CastingFit_service.speech_to_text(file)
    except Exception as e:
        logger.error(f"Error in speech_to_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/text-to-speech")
@limiter.limit("30/minute")
async def text_to_speech_vapi(request: Request, text_request: TextToSpeechRequest):
    """Convert text to speech using VAPI."""
    try:
        return await CastingFit_service.text_to_speech(text_request.text)
    except Exception as e:
        logger.error(f"Error in text_to_speech: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/call-feedback")
@limiter.limit("20/minute")
async def call_feedback(request: Request, call_id: str = Query(...)):
    """Get feedback for a specific call."""
    try:
        return await CastingFit_service.get_call_feedback(call_id)
    except Exception as e:
        logger.error(f"Error in call_feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
def root():
    return {"message": "API is running"} 