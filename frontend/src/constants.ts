/**
 * Constants for the frontend application.
 */

// API Configuration
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || '/api',
  timeout: 30000, // 30 seconds
  cacheDuration: 5 * 60 * 1000, // 5 minutes
} as const;

// Audio Configuration
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  channels: 1,
} as const;

// UI Configuration
export const UI_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFileTypes: ['audio/wav', 'audio/mp3', 'audio/mpeg'],
} as const; 