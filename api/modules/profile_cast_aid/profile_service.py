"""
Profile service module for handling profile analysis and assistance.
"""
import logging
import traceback
from fastapi import HTTPException, UploadFile, File, Form
import requests
import pdfplumber
from llm_providers import get_llm_client

logger = logging.getLogger(__name__)

class TavilyService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.tavily.com/search"

    def get_context(self, query: str) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {"q": query, "num_results": 3}
        try:
            resp = requests.get(self.base_url, headers=headers, params=params, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("context", "")
            else:
                return ""
        except Exception as e:
            logger.error(f"Tavily error: {e}")
            return ""

class ProfileService:
    def __init__(self, tavily_api_key: str = None):
        self.tavily_service = TavilyService(tavily_api_key) if tavily_api_key else None

    async def parse_profile(self, requirements: str, file: UploadFile):
        """Parse and analyze a candidate's profile."""
        try:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail="Only PDF files are supported.")
            contents = await file.read()
            with open("/tmp/profile.pdf", "wb") as f:
                f.write(contents)
            with pdfplumber.open("/tmp/profile.pdf") as pdf:
                text = "\n".join(page.extract_text() or '' for page in pdf.pages)
            if not text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
            
            # Get Tavily context if available
            tavily_context = ""
            if self.tavily_service:
                query = f"Key skills and competencies for: {requirements}\n{text[:500]}"
                tavily_context = self.tavily_service.get_context(query)

            # Generate skills analysis
            llm = get_llm_client()
            prompt = f"""
You are an expert technical recruiter and skills analyst.

ROLE REQUIREMENTS:
{requirements}

CANDIDATE PROFILE TEXT:
{text}

WEB CONTEXT (from Tavily):
{tavily_context}

Using ALL the information above, extract a comprehensive, structured list of the candidate's key skills, technical competencies, and relevant experience. 
- Cross-reference the candidate's profile with the role requirements and the latest web context.
- Highlight both explicit and inferred skills/competencies.
- Group the output into sections: MUST HAVE, SHOULD HAVE, COULD HAVE, and OTHER RELEVANT SKILLS/EXPERIENCE.
- For each skill/competency, add a brief explanation or context if possible.
- Output in clear markdown format.
"""
            skills = llm.invoke(prompt)
            if isinstance(skills, dict) and "content" in skills:
                skills = skills["content"]
            return {"skills": skills.strip()}
        except Exception as e:
            logger.error(f"Error parsing profile: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail="Failed to parse profile PDF.") 