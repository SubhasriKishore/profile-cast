import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '../services/api';

// --- Animated Mic SVG ---
const AnimatedMic = ({ listening }: { listening: boolean }) => (
  <div className="relative flex items-center justify-center">
    <svg
      className={`w-10 h-10 ${listening ? 'text-red-500' : 'text-gray-400'}`}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 14 0z" />
    </svg>
    {listening && (
      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
    )}
  </div>
);

const MediaRecorderClientOnly = dynamic(() => import('./MediaRecorderClientOnly'), { ssr: false });

export interface AICastingFiterProps {
  isCastingFiting: boolean;
  status: string;
  onUserResponse: (response: string, audioBlob?: Blob) => void;
  onLeaveCastingFit?: () => void;
}

export const AICastingFiter: React.FC<AICastingFiterProps> = ({
  isCastingFiting,
  status,
  onUserResponse,
  onLeaveCastingFit,
}) => {
  // --- State to control recording ---
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recStatus, setRecStatus] = useState<string>('');
  const startRecordingRef = useRef<() => void>();
  const stopRecordingRef = useRef<() => void>();

  // --- Start/stop recording based on status prop ---
  useEffect(() => {
    if (isCastingFiting && status === 'listening') {
      setIsListening(true);
    } else {
      setIsListening(false);
    }
  }, [isCastingFiting, status]);

  // --- Control MediaRecorderClientOnly from main component ---
  useEffect(() => {
    if (isListening && recStatus !== 'recording' && startRecordingRef.current) {
      startRecordingRef.current();
    } else if (!isListening && recStatus === 'recording' && stopRecordingRef.current) {
      stopRecordingRef.current();
    }
  }, [isListening, recStatus]);

  // --- Handler for when recording stops ---
  const handleStop = async (mediaBlobUrl: string | undefined) => {
    setIsListening(false);
    setLiveTranscript('');
    if (mediaBlobUrl) {
      try {
        const audioBlob = await fetch(mediaBlobUrl).then(r => r.blob());
        // Convert Blob to File
        const audioFile = new File([audioBlob], 'audio-recording.wav', {
          type: 'audio/wav',
          lastModified: Date.now()
        });
        const result = await api.speechToText(audioFile);
        const text = result.text || '';
        setLiveTranscript(text);
        if (/leave CastingFit|end CastingFit|stop CastingFit/i.test(text) && onLeaveCastingFit) {
          onLeaveCastingFit();
        } else {
          onUserResponse(text, audioBlob);
        }
      } catch (err) {
        setLiveTranscript('');
        onUserResponse('', undefined);
      }
    }
  };

  // --- UI ---
  return (
    <div className="flex flex-col items-center transition-all duration-500">
      {/* Animated Mic and Status */}
      <div className="mt-4 flex items-center gap-4">
        <AnimatedMic listening={isListening} />
        <span className="text-sm text-gray-600 transition-all duration-300">
          {isListening && 'Recording...'}
          {!isListening && status === 'analyzing' && 'Analyzing your answer...'}
          {!isListening && status === 'speaking' && 'Speaking question...'}
          {!isListening && status === 'next' && 'Next question coming up...'}
          {!isListening && status === '' && 'Waiting for question...'}
        </span>
      </div>
      {/* Show transcript after STT result */}
      {liveTranscript && !isListening && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg max-w-lg w-full shadow transition-all duration-300">
          <p className="text-gray-700 animate-fade-in">{liveTranscript}</p>
        </div>
      )}
      {/* MediaRecorderClientOnly handles audio recording and triggers handleStop */}
      <MediaRecorderClientOnly
        onStop={handleStop}
        render={({ status: recStatusVal, startRecording, stopRecording }) => {
          setRecStatus(recStatusVal);
          startRecordingRef.current = startRecording;
          stopRecordingRef.current = stopRecording;
          return null;
        }}
      />
    </div>
  );
}; 