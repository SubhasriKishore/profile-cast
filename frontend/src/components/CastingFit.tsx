import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Vapi: any;
try {
  // Dynamically require for environments without types
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Vapi = require("@vapi-ai/web").default;
} catch (e) {
  // fallback for environments where module is not available
  Vapi = undefined;
}
import { Paper, Box, Grid, Typography, TextField, Button, Avatar, IconButton, CircularProgress, List, ListItem, ListItemAvatar, ListItemText, Switch, FormControlLabel, Stack, Tooltip } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import { ResourceCleanup } from '../utils/cleanup';
import { useCastingFit } from '../contexts/CastingFitContext';

interface Message {
  content: string;
  timestamp: Date;
  isCastingFiter: boolean;
  sender: {
    name: string;
    avatar?: string;
  };
}

interface AgentOptions {
  name: string;
  firstMessage: string;
  transcriber: {
    provider: string;
    model: string;
    language: string;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  model: {
    provider: string;
    model: string;
    messages: Array<{
      role: string;
      content: string;
    }>;
  };
}

// Update the color map
const skillColor = {
  good: '#a5d6a7',    // green
  ok: '#fff59d',      // yellow
  weak: '#ef9a9a',    // red
  neutral: '#e0e0e0', // grey
};

interface FeedbackSkill {
  name: string;
  status: 'good' | 'ok' | 'weak' | 'neutral' | string;
}
interface FeedbackSummary {
  take: string;
  strong: string[];
  ok: string[];
  weak: string[];
}
interface StructuredFeedback {
  role: string;
  skills: {
    must: FeedbackSkill[];
    should: FeedbackSkill[];
    could: FeedbackSkill[];
  };
  summary: FeedbackSummary;
}
function isStructuredFeedback(obj: unknown): obj is StructuredFeedback {
  return obj !== null && 
    typeof obj === 'object' && 
    'role' in obj && 
    'skills' in obj && 
    typeof (obj as StructuredFeedback).role === 'string' &&
    typeof (obj as StructuredFeedback).skills === 'object' &&
    (obj as StructuredFeedback).skills !== null &&
    'must' in (obj as StructuredFeedback).skills &&
    'should' in (obj as StructuredFeedback).skills &&
    'could' in (obj as StructuredFeedback).skills;
}

const statusIcon = {
  good: <CheckCircleOutlineIcon sx={{ color: '#388e3c' }} fontSize="small" />, // green
  ok: <WarningAmberOutlinedIcon sx={{ color: '#fbc02d' }} fontSize="small" />, // yellow
  weak: <HighlightOffOutlinedIcon sx={{ color: '#d32f2f' }} fontSize="small" />, // red
  neutral: <InfoOutlinedIcon sx={{ color: '#757575' }} fontSize="small" />,
};

const SkillChip = styled(Paper)(({ theme, color = '#fff9c4' }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1.2),
  backgroundColor: color,
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  margin: theme.spacing(0.25, 0),
  minWidth: '80px',
  fontWeight: 500,
  fontSize: 13,
  transition: 'transform 0.12s, box-shadow 0.12s',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  },
}));

// Restore getSkillCoverage function
function getSkillCoverage(feedbackObj: StructuredFeedback) {
  const must = feedbackObj.skills.must.length;
  const should = feedbackObj.skills.should.length;
  const could = feedbackObj.skills.could.length;
  const good = [
    ...feedbackObj.skills.must,
    ...feedbackObj.skills.should,
    ...feedbackObj.skills.could,
  ].filter(skill => skill.status === 'good').length;
  const total = must + should + could;
  return total > 0 ? Math.round((good / total) * 100) : 0;
}

export const CastingFit: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId] = useState<string | null>(null);
  const [castingFitActive, setCastingFitActive] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [status, setStatus] = useState("");
  const [feedbackSummary, setFeedbackSummary] = useState<string | StructuredFeedback>("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setCurrentQuestion] = useState("");
  const { requirements, setRequirements, skillsContext, setSkillsContext } = useCastingFit();
  const [parsedSkills] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [feedbackProcessing, setFeedbackProcessing] = useState(false);

  const defaultRequirements = `Frontend Lead/Senior
MUST
React + Next
NodeJS / Typescript
CMS experience (content modeling)
Design system, Styling, A11y, etc
SHOULD
Vercel / Azure
Uniform / Contentstack
COULD
Devops (CI/CD)
RING`;

  const defaultSkillsContext = `trained under front-end technologies such as HTML, CSS, JavaScript,
React.js, React Native, Vue, TypeScript, MongoDB, Node.js, Express.js. I am
hardworking sincere professional looking forward to prove my skills.
Skills
Competencies
Frontend DevelopmentReact ContextReact Router
Tools & Frameworks
CSSExpress.jsHTML5JavaScriptMongoDBNode.jsReactReact HooksReact
NativeTypeScriptVue.JS`;

  // Ensure state is initialized with defaults so the button is enabled
  useEffect(() => {
    if (!requirements) setRequirements(defaultRequirements);
    if (!skillsContext) setSkillsContext(defaultSkillsContext);
    // eslint-disable-next-line
  }, []);

  const leaveCastingFit = useCallback(async (overrideCallId?: string | null) => {
    setCastingFitActive(false);
    setShowFeedback(true);
    setCurrentQuestion("");
    setStatus("");
    
    const uniqueMessages = messages.filter((msg, index, self) => 
      index === self.findIndex((m) => m.content === msg.content && m.sender.name === msg.sender.name)
    );
    
    setMessages([
      ...uniqueMessages,
      {
        content: "We truly appreciate your time and the insights you shared. Wishing you all the best on your career journey ahead. Your manager will follow up with feedback shortly.",
        timestamp: new Date(),
        isCastingFiter: true,
        sender: { name: 'Bot' }
      }
    ]);

    const fetchFeedback = async (callId: string, retries = 10) => {
      try {
        const result = await api.getCallFeedback(callId);
        console.log('[CastingFit] Feedback API response:', result);
        if (!result || (typeof result === 'string' && ((result as string).trim() === ''))) {
          if (retries > 0) {
            setTimeout(() => fetchFeedback(callId, retries - 1), 5000);
            setFeedbackLoading(true);
            return;
          } else {
            setFeedbackSummary('No feedback available for this call.');
            setFeedbackLoading(false);
            return;
          }
        }
        if (result && result.processing && retries > 0) {
          setFeedbackLoading(true);
          setTimeout(() => fetchFeedback(callId, retries - 1), 5000);
          return;
        }
        if (
          result &&
          typeof result === 'object' &&
          'role' in result &&
          'skills' in result &&
          'summary' in result
        ) {
          setFeedbackSummary(result as StructuredFeedback);
        } else if (result.feedback_summary || result.feedback_fallback) {
          setFeedbackSummary(result.feedback_summary || result.feedback_fallback || '');
        } else if (typeof result === 'string' && ((result as string).trim().startsWith('{'))) {
          try {
            const parsed = JSON.parse(result);
            setFeedbackSummary(parsed);
          } catch (e) {
            setFeedbackSummary(result);
          }
        } else {
          setFeedbackSummary(JSON.stringify(result) || '');
        }
        setFeedbackLoading(false);
      } catch (err) {
        console.error('[CastingFit] Error fetching feedback:', err);
        if (retries > 0) {
          setTimeout(() => fetchFeedback(callId, retries - 1), 5000);
          setFeedbackLoading(true);
        } else {
          setFeedbackSummary('Failed to fetch feedback summary.');
          setFeedbackLoading(false);
        }
      }
    };

    const feedbackCallId = overrideCallId !== undefined ? overrideCallId : callId;
    if (feedbackCallId) {
      setFeedbackLoading(true);
      setFeedbackSummary("");
      fetchFeedback(feedbackCallId);
    } else {
      setFeedbackSummary('No call ID available to fetch feedback.');
    }
  }, [messages, callId, setCastingFitActive, setShowFeedback, setCurrentQuestion, setStatus, setMessages, setFeedbackLoading, setFeedbackSummary]);

  const startCastingFit = useCallback(async (requirements: string, skillsContext: string) => {
    if (!requirements || !skillsContext) {
      setError('Requirements and skills context are required for CastingFit');
      return;
    }

    setIsLoading(true);
    setError("");
    setShowFeedback(false);
    setFeedbackSummary("");
    setFeedbackLoading(false);
    setMessages([]);
    setCurrentQuestion("");
    setStatus("");
    setCastingFitActive(true);
    setCallId(null);

    try {
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY || "");
      ResourceCleanup.getInstance().registerResource('vapi', vapi);

      const AgentOptions: AgentOptions = {
        name: "AI CastingFiter",
        firstMessage: "Hello, thank you for joining today's discussion!",
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: "en-US",
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer",
        },
        model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are an AI Technical Recruiter.

ROLE REQUIREMENTS:
${requirements}

CANDIDATE PROFILE SKILLS/CONTEXT:
${skillsContext}

Your job is to conduct a professional, adaptive discussion with the candidate.
- Ask only one question at a time, and make each question specific to the candidate's profile and the role requirements.
- After the candidate answers, analyze their response and then ask the next most relevant, specific question.
- Do not ask the next question until the candidate has responded.
- Use the candidate's answers to guide your follow-up questions.
- If the candidate shows intent to 'leave' or 'end', politely end the session and thank them.
- Before ending the discussion, give a warm thank you, wish them the best, and let them know that feedback will be shared by their manager.
Begin the discussion with a friendly greeting and your first question.`,
            },
          ],
        },
      };

      vapi.on('call-end', () => leaveCastingFit());
      vapi.on('error', (err: unknown) => {
        if (
          err &&
          typeof err === 'object' &&
          'errorMsg' in err &&
          typeof (err as { errorMsg?: string }).errorMsg === 'string' &&
          (err as { errorMsg: string }).errorMsg === 'Meeting has ended'
        ) {
          return;
        }
        console.error('VAPI error:', err);
        setError('Connection error. Please try again.');
      });

      const vapiStartResult = vapi.start(AgentOptions as unknown);
      if (vapiStartResult && typeof vapiStartResult.then === 'function') {
        vapiStartResult.then((callResp: { id?: string } | null) => {
          console.log('[VAPI] vapi.start() response:', callResp);
          if (callResp && callResp.id) {
            setCallId(callResp.id);
            console.log('[VAPI] callId set from vapi.start() response:', callResp.id);
            vapi.on('call-end', () => leaveCastingFit(callResp.id));
          } else {
            console.warn('[VAPI] vapi.start() response missing id or is null:', callResp);
            vapi.on('call-end', () => leaveCastingFit(null));
          }
        }).catch((err: unknown) => {
          console.error('[VAPI] vapi.start() error:', err);
          setError('Failed to start CastingFit session. Please try again.');
          vapi.on('call-end', () => leaveCastingFit(null));
        });
      }

      const welcomeMessage: Message = {
        content: `This conversation is intended to understand how your approach and thinking align with the objectives of the project. It's an opportunity to exchange ideas, share perspectives, and learn more about your experience and interests.
        Please feel free to ask any questions you may have about the opportunity at any point during our discussion.`,
        timestamp: new Date(),
        isCastingFiter: true,
        sender: { name: 'Bot' }
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error starting CastingFit:', error);
      setError('Failed to start CastingFit session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setError, setIsLoading, setShowFeedback, setFeedbackSummary, setFeedbackLoading, setMessages, setCurrentQuestion, setStatus, setCastingFitActive, setCallId, leaveCastingFit]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startCastingFitCallback = useCallback((req: string, skills: string) => {
    startCastingFit(req, skills);
  }, [startCastingFit]);

  React.useEffect(() => {
    if (!castingFitActive && !sessionId) {
      startCastingFitCallback(requirements || '', parsedSkills || '');
    }
  }, [castingFitActive, sessionId, requirements, parsedSkills, startCastingFitCallback]);

  React.useEffect(() => {
    console.log('[CastingFit] callId state changed:', callId);
  }, [callId]);

  React.useEffect(() => {
    if (showFeedback && feedbackLoading) {
      setFeedbackProcessing(true);
    } else if (showFeedback && !feedbackLoading) {
      setFeedbackProcessing(false);
    }
  }, [showFeedback, feedbackLoading]);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      ResourceCleanup.getInstance().cleanup();
      setMessages([]);
      setCastingFitActive(false);
    };
  }, []);

  // --- Voice UI Handlers ---
  const handleMicClick = () => {
    setIsMicActive((prev) => !prev);
    // Optionally trigger start/stop listening logic here
  };

  // --- Feedback Section (always rendered, but only visible when showFeedback or feedbackProcessing) ---
  const renderFeedbackSection = () => {
    if (feedbackProcessing) {
      return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 6, p: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>CastingFit Feedback</Typography>
          <LinearProgress sx={{ my: 3 }} />
          <Typography variant="body1" color="textSecondary">Generating feedback, please wait…</Typography>
        </Box>
      );
    }
    if (showFeedback) {
      let feedbackObj: unknown = null;
      let isStructured = false;
      let summaryObj: FeedbackSummary = { strong: [], ok: [], weak: [], take: '' };
      try {
        if (typeof feedbackSummary === 'string') {
          let fixed = feedbackSummary.trim();
          if (fixed && fixed[0] === '{' && fixed[fixed.length - 1] !== '}') {
            fixed += '}';
          }
          const openArr = (fixed.match(/\[/g) || []).length;
          let closeArr = (fixed.match(/\]/g) || []).length;
          while (openArr > closeArr) {
            fixed += ']';
            closeArr++;
          }
          feedbackObj = JSON.parse(fixed);
        } else {
          feedbackObj = feedbackSummary;
        }
        isStructured = isStructuredFeedback(feedbackObj);
        if (isStructured && feedbackObj && (feedbackObj as StructuredFeedback).summary && typeof (feedbackObj as StructuredFeedback).summary === 'object') {
          summaryObj = (feedbackObj as StructuredFeedback).summary;
        }
      } catch (e: unknown) {
        feedbackObj = null;
        isStructured = false;
        summaryObj = { strong: [], ok: [], weak: [], take: '' };
        console.log('Failed to parse feedback JSON:', e);
      }
      if (isStructured && feedbackObj && (feedbackObj as StructuredFeedback).summary && typeof (feedbackObj as StructuredFeedback).summary === 'object') {
        const coverage = getSkillCoverage(feedbackObj as StructuredFeedback);
        return (
          <Box sx={{ maxWidth: "100%", mx: 'auto', p: 4, mt: 0 }}>
            <Paper elevation={4} sx={{ p: 2, borderRadius: 4, bgcolor: '#fff' }}>
              <Grid container spacing={4} alignItems="flex-start">
                <Grid item xs={12} md={4}>
                  <Stack spacing={3} sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 1.5, minHeight: 350 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 20, mb: 1 }}>Casting Fit Feedback</Typography>
                    <Typography variant="subtitle2" sx={{ fontSize: 13, mb: 1 }}>Overall Skill Match</Typography>
                    <LinearProgress variant="determinate" value={coverage} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: 12 }}>{coverage}% of skills rated as &quot;good&quot;</Typography>
                    <Typography variant="subtitle2" sx={{ fontSize: 13, mt: 2, mb: 1 }}>Summary / take</Typography>
                    <Paper elevation={0} sx={{ p: 1, bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2', fontSize: 10 }}>
                      {summaryObj.take}
                    </Paper>
                  </Stack>
                </Grid>
                <Grid item xs={15} md={4}>
                  <Stack spacing={2} sx={{ bgcolor: '#f4f8f6', borderRadius: 2, p: 1.5, minHeight: 350 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: 15, mb: 1 }}>QA & Testing</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {isStructured && (feedbackObj as StructuredFeedback).skills.must
                        .filter((skill: unknown): skill is FeedbackSkill => 
                          typeof skill === 'object' && 
                          skill !== null && 
                          'name' in skill && 
                          typeof (skill as FeedbackSkill).name === 'string' && 
                          (skill as FeedbackSkill).name.toLowerCase().includes('test')
                        )
                        .map((skill: FeedbackSkill, idx: number) => (
                          <Box key={idx}>
                            <Tooltip title={skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}>
                              <SkillChip color={skillColor[skill.status]}>
                                {statusIcon[skill.status]}
                                {skill.name}
                              </SkillChip>
                            </Tooltip>
                          </Box>
                        ))}
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={2} sx={{ bgcolor: '#f4f8f6', borderRadius: 2, p: 1.5, minHeight: 350 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: 15, mb: 1 }}>Frontend Development</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {isStructured && (feedbackObj as StructuredFeedback).skills.must
                        .filter((skill: unknown): skill is FeedbackSkill => 
                          typeof skill === 'object' && 
                          skill !== null && 
                          'name' in skill && 
                          typeof (skill as FeedbackSkill).name === 'string' && (
                            (skill as FeedbackSkill).name.toLowerCase().includes('react') || 
                            (skill as FeedbackSkill).name.toLowerCase().includes('typescript') ||
                            (skill as FeedbackSkill).name.toLowerCase().includes('design')
                          )
                        )
                        .map((skill: FeedbackSkill, idx: number) => (
                          <Box key={idx}>
                            <Tooltip title={skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}>
                              <SkillChip color={skillColor[skill.status]}>
                                {statusIcon[skill.status]}
                                {skill.name}
                              </SkillChip>
                            </Tooltip>
                          </Box>
                        ))}
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={2} sx={{ bgcolor: '#f8f4fa', borderRadius: 2, p: 1.5, minHeight: 350 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: 15, mb: 1 }}>CMS & Systems Experience</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {isStructured && [
                        ...(feedbackObj as StructuredFeedback).skills.must
                          .filter((skill: unknown): skill is FeedbackSkill => 
                            typeof skill === 'object' && 
                            skill !== null && 
                            'name' in skill && 
                            typeof (skill as FeedbackSkill).name === 'string' && 
                            (skill as FeedbackSkill).name.toLowerCase().includes('cms')
                          )
                        ,
                        ...(feedbackObj as StructuredFeedback).skills.should
                          .filter((skill: unknown): skill is FeedbackSkill => 
                            typeof skill === 'object' && 
                            skill !== null && 
                            'name' in skill && 
                            typeof (skill as FeedbackSkill).name === 'string' && 
                            (skill as FeedbackSkill).name.toLowerCase().includes('content')
                          )
                      ].map((skill: FeedbackSkill, idx: number) => (
                        <Box key={idx}>
                          <Tooltip title={skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}>
                            <SkillChip color={skillColor[skill.status]}>
                              {statusIcon[skill.status]}
                              {skill.name}
                            </SkillChip>
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack spacing={2} sx={{ bgcolor: '#f8f4fa', borderRadius: 2, p: 1.5, minHeight: 350 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: 15, mb: 1 }}>Cloud & DevOps</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {isStructured && [
                        ...(feedbackObj as StructuredFeedback).skills.should
                          .filter((skill: unknown): skill is FeedbackSkill => 
                            typeof skill === 'object' && 
                            skill !== null && 
                            'name' in skill && 
                            typeof (skill as FeedbackSkill).name === 'string' && (
                              (skill as FeedbackSkill).name.toLowerCase().includes('azure') || 
                              (skill as FeedbackSkill).name.toLowerCase().includes('vercel')
                            )
                          )
                        ,
                        ...(feedbackObj as StructuredFeedback).skills.could
                          .filter((skill: unknown): skill is FeedbackSkill => 
                            typeof skill === 'object' && 
                            skill !== null && 
                            'name' in skill && 
                            typeof (skill as FeedbackSkill).name === 'string' && 
                            (skill as FeedbackSkill).name.toLowerCase().includes('devops')
                          )
                      ].map((skill: FeedbackSkill, idx: number) => (
                        <Box key={idx}>
                          <Tooltip title={skill.status.charAt(0).toUpperCase() + skill.status.slice(1)}>
                            <SkillChip color={skillColor[skill.status]}>
                              {statusIcon[skill.status]}
                              {skill.name}
                            </SkillChip>
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      }
      // Fallback view for invalid or missing feedback
      let fallbackText = '';
      if (feedbackObj && typeof feedbackObj === 'object') {
        const fb = feedbackObj as Record<string, unknown>;
        fallbackText = (fb.feedback_fallback as string) || (fb.feedback_summary as string) || JSON.stringify(feedbackObj, null, 2);
      } else if (typeof feedbackSummary === 'string') {
        fallbackText = feedbackSummary;
      }
      return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 6, p: 4, textAlign: 'left' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>CastingFit Feedback</Typography>
          <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'error.main' }}>
              {fallbackText || 'No feedback available or feedback could not be parsed.'}
            </Typography>
          </Paper>
        </Box>
      );
    }
    return null;
  };

  if (!castingFitActive && !showFeedback) {
    return (
      <Paper elevation={3} sx={{ maxWidth: 700, mx: 'auto', mt: 6, p: 4, borderRadius: 4 }}>
        <Typography variant="h5" gutterBottom>
          CastingFit Requirements
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Enter role requirements
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={requirements || defaultRequirements}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value || '';
            setRequirements(value);
          }}
          placeholder="Enter role requirements..."
          sx={{ mt: 2, mb: 2 }}
        />
        <Typography variant="subtitle1" gutterBottom>
          Enter candidate Skill context
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={skillsContext || defaultSkillsContext}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value || '';
            setSkillsContext(value);
          }}
          placeholder="Enter candidate skills context..."
          sx={{ mt: 2, mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => startCastingFit(requirements, skillsContext)}
          disabled={!requirements || !skillsContext}
          sx={{ mt: 2 }}
        >
          Start CastingFit
        </Button>
      </Paper>
    );
  }

  // --- Main Render ---
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 2 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, justifyContent: 'flex-start' }}>
          {/* Chat Section (left) */}
          <Box sx={{ flex: 1, minWidth: 340, maxWidth: 440, transition: 'opacity 0.3s', opacity: (feedbackProcessing || showFeedback) ? 0.4 : 1, pointerEvents: (feedbackProcessing || showFeedback) ? 'none' : 'auto', filter: (feedbackProcessing || showFeedback) ? 'grayscale(1)' : 'none', ml: { xs: 0, md: 2 } }}>
            <Paper elevation={4} sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, mb: 3, bgcolor: '#fff', minHeight: 600, maxHeight: 700, display: 'flex', flexDirection: 'column' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
                  <Typography variant="h5" fontWeight="bold">CastingFit Chat</Typography>
                  <FormControlLabel
                    control={<Switch checked={showTranscript} onChange={() => setShowTranscript((v) => !v)} />}
                    label="Show Transcript"
                  />
                </Box>
                {showTranscript && (
                  <Paper elevation={0} sx={{ mb: 1, p: 1, maxHeight: 100, overflowY: 'auto', background: '#f9f9f9', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Transcript
                    </Typography>
                    <Box sx={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
                      {messages
                        .filter((msg, index, self) =>
                          index === self.findIndex((m) => m.content === msg.content && m.sender.name === msg.sender.name)
                        )
                        .map(msg => `${msg.sender.name}: ${msg.content}`)
                        .join('\n') || 'No transcript yet.'}
                    </Box>
                  </Paper>
                )}
                <Paper elevation={1} sx={{ p: 1.5, minHeight: 350, maxHeight: 500, overflowY: 'auto', mb: 1, background: '#fff', borderRadius: 1 }}>
                  <List>
                    {messages
                      .filter((msg, index, self) =>
                        index === self.findIndex((m) => m.content === msg.content && m.sender.name === msg.sender.name)
                      )
                      .map((message, index) => {
                        const isUser = !message.isCastingFiter;
                        return (
                          <ListItem key={index} alignItems="flex-start" sx={{ py: 0.5 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: isUser ? 'primary.main' : 'secondary.main', width: 32, height: 32, fontSize: 16 }}>
                                {isUser ? 'Y' : 'AI'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography variant="body2">{message.content}</Typography>}
                              secondary={
                                <Typography component="span" variant="caption" color="textSecondary">
                                  {isUser ? 'You' : 'AI Casting Fit Bot'} | {message.timestamp.toLocaleTimeString()}
                                </Typography>
                              }
                            />
                          </ListItem>
                        );
                      })}
                  </List>
                  <div ref={messagesEndRef} />
                </Paper>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                  <IconButton
                    color={status === 'listening' ? 'primary' : 'default'}
                    onClick={handleMicClick}
                    size="medium"
                    sx={{ bgcolor: status === 'listening' ? 'primary.light' : 'grey.200', boxShadow: 1, mr: 1 }}
                  >
                    {status === 'listening' || isMicActive ? <MicIcon fontSize="medium" /> : <MicOffIcon fontSize="medium" />}
                  </IconButton>
                  <Typography variant="body2" color="textSecondary">
                    {status === 'listening' && 'Listening...'}
                    {status === 'analyzing' && (<><CircularProgress size={14} sx={{ mr: 1 }} />Analyzing...</>)}
                    {status === 'speaking' && 'Speaking...'}
                    {status === 'next' && 'Next question coming up...'}
                  </Typography>
                </Box>
                <Button
                  onClick={() => leaveCastingFit()}
                  variant="outlined"
                  color="secondary"
                  sx={{ mt: 2, display: 'block', mx: 'auto', fontSize: 14, py: 0.5, px: 2 }}
                  disabled={isLoading}
                >
                  Leave CastingFit
                </Button>
                {error && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                    {error}
                    <Button onClick={() => { setError(''); setStatus(''); setIsLoading(false); }} sx={{ ml: 1 }} size="small" variant="contained" color="error">Dismiss</Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
          {/* Feedback Section (right) */}
          <Box sx={{ flex: 1.2, minWidth: 320, maxWidth: 600 }}>
            {renderFeedbackSection()}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 