"""
CastingFit service module for handling CastingFit-related operations.
"""
import logging
import traceback
from fastapi import HTTPException, UploadFile, File, Query
import requests
from llm_providers import get_llm_client
from config import Config
import json
import time

logger = logging.getLogger(__name__)

class CastingFitService:
    def __init__(self, vapi_api_key: str):
        self.vapi_api_key = vapi_api_key
        self.vapi_base_url = "https://api.vapi.ai/v1/speech-to-text"
        self.vapi_tts_url = "https://api.vapi.ai/v1/text-to-speech"

    async def speech_to_text(self, file: UploadFile):
        """Convert speech to text using VAPI."""
        try:
            if not self.vapi_api_key:
                raise HTTPException(status_code=500, detail="VAPI_API_KEY not set in environment.")
            audio_bytes = await file.read()
            headers = {"Authorization": f"Bearer {self.vapi_api_key}"}
            files = {"file": (file.filename, audio_bytes, file.content_type)}
            response = requests.post(self.vapi_base_url, headers=headers, files=files)
            if response.status_code != 200:
                logger.error(f"VAPI API error: {response.text}")
                raise HTTPException(status_code=500, detail="VAPI API error: " + response.text)
            data = response.json()
            return {"text": data.get("text", "")}
        except Exception as e:
            logger.error(f"Error in VAPI speech-to-text: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=str(e))

    async def text_to_speech(self, text: str):
        """Convert text to speech using VAPI."""
        try:
            if not self.vapi_api_key:
                raise HTTPException(status_code=500, detail="VAPI_BE_API_KEY not set in environment.")
            payload = {"text": text}
            headers = {
                "Authorization": f"Bearer {self.vapi_api_key}",
                "Content-Type": "application/json"
            }
            response = requests.post(self.vapi_tts_url, headers=headers, json=payload)
            if response.status_code != 200:
                logger.error(f"VAPI TTS API error: {response.text}")
                raise HTTPException(status_code=500, detail="VAPI TTS API error: " + response.text)
            data = response.json()
            return {"audio": data.get("audio", "")}
        except Exception as e:
            logger.error(f"Error in VAPI text-to-speech: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_call_feedback(self, call_id: str):
        """Get feedback for a specific call."""
        try:
            if not self.vapi_api_key:
                raise HTTPException(status_code=500, detail="VAPI_BE_API_KEY not set in environment.")
            headers = {"Authorization": f"Bearer {self.vapi_api_key}"}
            logger.info(f"VAPI_API_KEY used: {self.vapi_api_key}")
            vapi_url = f"https://api.vapi.ai/call?id={call_id}"
            
            # Log request details
            logger.info(f"Making VAPI request to: {vapi_url}")
            logger.debug(f"Request headers: {json.dumps({k: '***' if k == 'Authorization' else v for k, v in headers.items()}, indent=2)}")
            
            # First attempt
            response = requests.get(vapi_url, headers=headers)
            logger.info(f"VAPI response status: {response.status_code}")
            logger.debug(f"VAPI response headers: {json.dumps(dict(response.headers), indent=2)}")
            
            if response.status_code != 200:
                logger.error(f"VAPI call fetch error: {response.text}")
                raise HTTPException(status_code=500, detail="VAPI call fetch error: " + response.text)
            
            call_data = response.json()
            logger.debug(f"VAPI call_data (raw) for call_id={call_id}: {json.dumps(call_data, indent=2)}")
            
            if isinstance(call_data, list):
                call_data = call_data[0] if call_data else {}
            if not isinstance(call_data, dict):
                logger.error(f"VAPI call_data is not a dict after extraction: {call_data}")
                raise HTTPException(status_code=500, detail="Invalid VAPI response format.")
                
            # Check if call is in progress
            if call_data.get('status') == 'in-progress':
                logger.info(f"Call {call_id} is in-progress. Waiting 30 seconds before retrying...")
                time.sleep(30)
                
                # Log retry request
                logger.info(f"Making retry VAPI request to: {vapi_url}")
                logger.debug(f"Retry request headers: {json.dumps({k: '***' if k == 'Authorization' else v for k, v in headers.items()}, indent=2)}")
                
                response = requests.get(vapi_url, headers=headers)
                logger.info(f"Retry VAPI response status: {response.status_code}")
                logger.debug(f"Retry VAPI response headers: {json.dumps(dict(response.headers), indent=2)}")
                
                call_data = response.json()
                logger.debug(f"VAPI call_data (after wait) for call_id={call_id}: {json.dumps(call_data, indent=2)}")
                
                if isinstance(call_data, list):
                    call_data = call_data[0] if call_data else {}
                if not isinstance(call_data, dict):
                    logger.error(f"VAPI call_data is not a dict after extraction: {call_data}")
                    raise HTTPException(status_code=500, detail="Invalid VAPI response format.")
                if call_data.get('status') == 'in-progress':
                    logger.warning(f"Call {call_id} still in-progress after delay. Returning processing status.")
                    return {"feedback_summary": None, "processing": True}
            
            messages = call_data.get("messages", [])
            transcript = "\n".join([f"{msg.get('role','')}: {msg.get('message','')}" for msg in messages])
            
            # If no transcript found, wait 20 seconds and retry once
            if not transcript.strip():
                logger.warning(f"No transcript found for call_id={call_id}. Retrying after 20 seconds...")
                time.sleep(20)
                
                # Log transcript retry request
                logger.info(f"Making transcript retry VAPI request to: {vapi_url}")
                logger.debug(f"Transcript retry request headers: {json.dumps({k: '***' if k == 'Authorization' else v for k, v in headers.items()}, indent=2)}")
                
                response = requests.get(vapi_url, headers=headers)
                logger.info(f"Transcript retry VAPI response status: {response.status_code}")
                logger.debug(f"Transcript retry VAPI response headers: {json.dumps(dict(response.headers), indent=2)}")
                
                call_data = response.json()
                if isinstance(call_data, list):
                    call_data = call_data[0] if call_data else {}
                messages = call_data.get("messages", [])
                transcript = "\n".join([f"{msg.get('role','')}: {msg.get('message','')}" for msg in messages])
                
                if not transcript.strip():
                    logger.warning(f"Still no transcript found for call_id={call_id} after retry")
                    return {"feedback_summary": "No transcript available for this call."}
            
            # Log transcript details
            logger.info(f"Transcript length: {len(transcript)} characters")
            logger.debug(f"Transcript content: {transcript[:500]}...")  # Log first 500 chars
            
            llm = get_llm_client()
            prompt = (
                "You are an expert CastingFit coach. Analyze the following CastingFit transcript and provide a feedback summary for the candidate. "
                "Return your feedback as a JSON object with the following structure: "
                '{"role": "...", "skills": {"must": [{"name": "...", "status": "..."}, ...], "should": [...], "could": [...]}, "summary": {"take": "...", "strong": [], "ok": [], "weak": []}}. '
                "Keep responses concise. For each skill, set status to: good, ok, weak, or neutral. "
                "Keep arrays short (max 3 items).\n\nTranscript:\n" + transcript
            )
            feedback = llm.invoke(prompt)
            import json as pyjson
            logger.debug(f"Raw LLM feedback: {feedback}")
            
            def fix_json_arrays(text):
                # Fix truncated arrays by adding closing brackets
                import re
                # Find arrays that are opened but not closed
                while True:
                    # Find position of last [
                    last_open = text.rfind('[')
                    if last_open == -1:
                        break
                    # Count brackets after this position
                    sub_str = text[last_open:]
                    open_count = sub_str.count('[')
                    close_count = sub_str.count(']')
                    if open_count > close_count:
                        text = text + ']'
                    else:
                        break
                return text

            def extract_json(text):
                import re
                match = re.search(r'\{[\s\S]*\}', text)
                if match:
                    json_str = match.group(0)
                    # Fix missing closing braces and arrays
                    open_count = json_str.count('{')
                    close_count = json_str.count('}')
                    if open_count > close_count:
                        json_str += '}'
                    json_str = fix_json_arrays(json_str)
                    return json_str
                return None

            try:
                if isinstance(feedback, dict):
                    return feedback
                # Try direct parse
                feedback_json = pyjson.loads(feedback)
                return feedback_json
            except Exception:
                # Try to extract and fix JSON substring
                json_str = extract_json(feedback)
                if json_str:
                    try:
                        feedback_json = pyjson.loads(json_str)
                        # Ensure arrays are present even if empty
                        if 'summary' in feedback_json:
                            feedback_json['summary'].setdefault('strong', [])
                            feedback_json['summary'].setdefault('ok', [])
                            feedback_json['summary'].setdefault('weak', [])
                        return feedback_json
                    except Exception as e:
                        logger.warning(f"Failed to parse fixed JSON: {e}")
                logger.warning(f"LLM feedback could not be parsed as structured JSON. Returning fallback.")
                return {"feedback_summary": feedback, "feedback_fallback": feedback, "format": "plain"}
        except Exception as e:
            logger.error(f"Error in call-feedback: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail="Failed to generate call feedback summary.") 