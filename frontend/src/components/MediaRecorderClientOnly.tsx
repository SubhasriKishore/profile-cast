import React from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';

interface MediaRecorderClientOnlyProps {
  onStop: (mediaBlobUrl: string | undefined) => void;
  render: (props: {
    status: string;
    startRecording: () => void;
    stopRecording: () => void;
    mediaBlobUrl: string | undefined;
  }) => React.ReactNode;
}

const MediaRecorderClientOnly: React.FC<MediaRecorderClientOnlyProps> = ({ onStop, render }) => {
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl
  } = useReactMediaRecorder({ audio: true, onStop });

  return <>{render({ status, startRecording, stopRecording, mediaBlobUrl })}</>;
};

export default MediaRecorderClientOnly; 