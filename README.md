# Profile Cast 🎯

An AI-powered platform that helps with profile analysis and CastingFit generation through two main modules: Profile Cast Aid and AI CastingFiter.

## Core Modules

### 1. Profile Cast Aid 📄
- PDF profile parsing and analysis
- Skills extraction and categorization
- Web context integration via Tavily
- Role requirement matching
- Structured skills analysis (MUST HAVE, SHOULD HAVE, COULD HAVE)
- LLM-powered skills analysis and categorization
- Integration with Tavily API for web context
- Comprehensive skills matching against job requirements

### 2. AI CastingFiter 🤖
- Speech-to-text conversion
- Text-to-speech synthesis
- CastingFit feedback generation
- Call transcript analysis
- Real-time CastingFit assistance
- Automated CastingFit feedback generation
- Transcript analysis using LLM
- Call feedback summarization with strengths and areas for improvement


## Tech Stack

### AI & Language Processing
- LLM Integration (OpenAI/Anthropic) - Profile analysis & feedback generation
- Tavily - Web context gathering
- VAPI - Speech-to-text and text-to-speech capabilities

### Backend
- Python
- FastAPI
- Modular architecture with separate services
- Uvicorn ASGI server
- pdfplumber for PDF parsing

### Frontend
- Next.js
- Production-ready configuration
- API integration with backend
- Modern web application features
- Development server with hot reloading

---

## Technical Specification

### Overview
Profile Cast is a full-stack AI-powered platform for automated candidate profile analysis and interview feedback. It leverages state-of-the-art LLMs, voice AI, and web context enrichment to deliver structured, actionable insights for both recruiters and candidates.

### Key Technologies & AI Tools
- **OpenAI GPT-4 / Anthropic Claude**: For natural language understanding, skills extraction, and feedback generation.
- **Tavily**: For real-time web context enrichment and skills validation.
- **VAPI**: For speech-to-text and text-to-speech, enabling voice-driven interviews and feedback.
- **FastAPI**: High-performance Python backend for API orchestration.
- **Next.js**: Modern React-based frontend for interactive dashboards and real-time feedback.
- **pdfplumber**: For PDF parsing and text extraction from candidate profiles.

### Data Flow
1. **Profile Upload**: User uploads a PDF profile and specifies role requirements.
2. **Profile Analysis**: Backend parses the PDF, extracts text, and uses LLMs to analyze skills and match requirements.
3. **Web Context**: Tavily API enriches the analysis with up-to-date web context.
4. **Voice Interview**: AI CastingFiter conducts a voice-based interview using VAPI for speech recognition and synthesis.
5. **Feedback Generation**: LLMs analyze the transcript and generate structured feedback, which is displayed in the frontend dashboard.

---

## Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend
      FE[Next.js App]
    end
    subgraph Backend
      BE[FastAPI Server]
      LLM[LLM Providers\n(OpenAI/Anthropic)]
      Tavily[Tavily API]
      VAPI[VAPI Speech API]
      PDFPlumber[pdfplumber\n(PDF Parsing)]
    end
    User((User))
    User-- Upload Profile/Start Interview -->FE
    FE-- API Calls -->BE
    BE-- PDF/Skills Extraction -->PDFPlumber
    BE-- Web Context -->Tavily
    BE-- LLM Analysis -->LLM
    BE-- Speech-to-Text/Text-to-Speech -->VAPI
    BE-- Feedback/Results -->FE
```

---

## System Architecture

### Services

1. **Backend Server** (Port 5000)
   - FastAPI application
   - Profile analysis
   - CastingFit management
   - API endpoints

2. **Frontend Server** (Port 3000)
   - Next.js application
   - User interface
   - Real-time updates
   - API integration

## API Endpoints

### Profile Cast Aid
- `POST /api/parse-profile`: Analyze candidate profiles against job requirements
  - Input: PDF file and role requirements
  - Output: Structured skills analysis

### AI CastingFiter
- `POST /api/speech-to-text`: Convert speech to text
  - Input: Audio file
  - Output: Transcribed text
- `POST /api/text-to-speech`: Convert text to speech
  - Input: Text content
  - Output: Audio response
- `GET /api/call-feedback`: Get CastingFit feedback
  - Input: Call ID
  - Output: Structured feedback analysis

## Project Structure
```
backend/
├── modules/
│   ├── ai_castingfit/
│   │   ├── __init__.py
│   │   └── castingfit_service.py
│   └── profile_cast_aid/
│       ├── __init__.py
│       └── profile_service.py
├── app.py
├── config.py
├── llm_providers.py
├── requirements.txt

frontend/
├── src/
│   ├── components/
│   │   ├── CastingFit.tsx
│   │   ├── ChatLayout.tsx
│   │   ├── AICastingFiter.tsx
│   │   ├── PageContainer.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── MediaRecorderClientOnly.tsx
│   │   ├── icons/
│   │   ├── chat/
│   │   └── ui/
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── index.tsx
│   │   ├── _app.tsx
│   │   └── castingfit.tsx
│   ├── utils/
│   ├── contexts/
│   ├── app/
│   ├── services/
│   ├── theme.ts
│   ├── reportWebVitals.ts
│   ├── App.css
│   └── index.css
├── public/
├── package.json
├── next.config.js
├── tsconfig.json
├── postcss.config.js
├── tailwind.config.js
└── tailwind.config.ts
```

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd profile-cast
   ```

2. Install backend dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. Set up environment variables:
   ```bash
   # Frontend (.env)
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   NEXT_PUBLIC_VAPI_API_KEY=your_vapi_frontend_api_key

   # Backend (.env)
   OPENAI_API_KEY=your_openai_api_key
   TAVILY_API_KEY=your_tavily_api_key
   VAPI_BE_API_KEY=your_vapi_backend_api_key
   VAPI_SPEECH_TO_TEXT_URL=https://api.vapi.ai/v1/speech-to-text
   VAPI_TEXT_TO_SPEECH_URL=https://api.vapi.ai/v1/text-to-speech
   VAPI_CALL_FEEDBACK_URL=https://api.vapi.ai/call
   ```

5. Start all services:
   ```bash
   ./start.sh
   ```

6. Access the applications:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)
   - API Documentation: [http://localhost:5000/docs](http://localhost:5000/docs)

## Vercel Deployment

### Prerequisites
1. Vercel account
2. GitHub repository connected to Vercel
3. All required API keys and environment variables

### Environment Variables Setup
Set the following environment variables in your Vercel project settings:

Frontend:
```
NEXT_PUBLIC_BACKEND_URL=https://your-project.vercel.app
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_frontend_api_key
```

Backend:
```
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key
VAPI_BE_API_KEY=your_vapi_backend_api_key
VAPI_SPEECH_TO_TEXT_URL=https://api.vapi.ai/v1/speech-to-text
VAPI_TEXT_TO_SPEECH_URL=https://api.vapi.ai/v1/text-to-speech
VAPI_CALL_FEEDBACK_URL=https://api.vapi.ai/call
```

### Vercel Build Settings
Configure the following in your Vercel project settings:

1. Build Command:
   ```bash
   cd frontend && npm install && npm run build
   ```

2. Output Directory:
   ```
   frontend/.next
   ```

3. Install Command:
   ```bash
   cd frontend && npm install
   ```

### Deployment Checklist

#### Pre-deployment
- [ ] All environment variables set in Vercel
- [ ] GitHub repository connected to Vercel
- [ ] Build settings configured correctly
- [ ] API keys and endpoints verified
- [ ] Frontend configuration optimized for production
- [ ] Backend API routes properly configured

#### Post-deployment Verification
- [ ] Frontend application accessible
- [ ] API endpoints responding correctly
- [ ] Environment variables loaded properly
- [ ] Build logs checked for errors
- [ ] CORS settings verified
- [ ] API rate limiting configured
- [ ] Error handling tested
- [ ] Performance metrics monitored

### Troubleshooting
1. If frontend fails to build:
   - Check Next.js configuration
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. If backend API fails:
   - Verify Python version compatibility
   - Check API routes configuration
   - Verify environment variables

3. If deployment fails:
   - Check Vercel build logs
   - Verify repository permissions
   - Check for any missing dependencies

## Features in Development
- Enhanced profile matching algorithms
- Advanced CastingFit feedback analysis
- Multi-language support
- Extended voice interaction capabilities
- Real-time collaboration features
- Advanced analytics dashboard

## Contributing
Please read our contributing guidelines before submitting pull requests.

## License
[Add license information]
