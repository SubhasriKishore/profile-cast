// --- API Service: Handles all backend API calls for the CastingFit App ---

// Use environment variable for backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api` : (() => { throw new Error('NEXT_PUBLIC_BACKEND_URL is not set in environment variables'); })();

// Cache implementation
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// --- Types for API requests and responses ---
export interface AudioRequest {
  text: string;
}

export interface FeedbackResponse {
  feedback_summary?: string;
  feedback_fallback?: string;
  format?: string;
  processing?: boolean;
}

// --- API Service Class ---
class ApiService {
  private async fetchWithTimeout(url: string, options: RequestInit, timeout = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  private getCachedData(key: string) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: unknown) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async getCallFeedback(callId: string): Promise<FeedbackResponse> {
    const cacheKey = `feedback-${callId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.fetchWithTimeout(
        `${API_BASE_URL}/call-feedback?call_id=${callId}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.statusText}`);
      }

      const data = await response.json();
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  async parseProfile(requirements: string, file: File): Promise<{ skills: string }> {
    const formData = new FormData();
    formData.append('requirements', requirements);
    formData.append('file', file);

    const response = await this.fetchWithTimeout(`${API_BASE_URL}/parse-profile`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to parse profile');
    }

    return response.json();
  }

  async speechToText(audioFile: File): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await this.fetchWithTimeout(`${API_BASE_URL}/speech-to-text`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to convert speech to text');
    }

    return response.json();
  }

  async textToSpeech(text: string): Promise<{ audio: string }> {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert text to speech');
    }

    return response.json();
  }
}

export const api = new ApiService(); 