import React from 'react';
import { Avatar } from '../ui/Avatar';

interface ChatMessageProps {
  content: string;
  timestamp: Date;
  isCastingFiter?: boolean;
  sender: {
    name: string;
    avatar?: string;
  };
  suggestedResponses?: string[];
  onSuggestedResponseClick?: (response: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  timestamp,
  isCastingFiter = false,
  sender,
  suggestedResponses,
  onSuggestedResponseClick
}) => {
  return (
    <div className={`flex ${isCastingFiter ? 'flex-row' : 'flex-row-reverse'} items-start gap-3 mb-4`}>
      <Avatar name={sender.name} src={sender.avatar} size="md" />
      
      <div className={`flex flex-col max-w-[70%] ${isCastingFiter ? 'items-start' : 'items-end'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">
            {sender.name}
          </span>
          <span className="text-xs text-gray-500">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div
          className={`rounded-lg px-4 py-2 ${
            isCastingFiter
              ? 'bg-blue-100 text-gray-800'
              : 'bg-blue-600 text-gray-50'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Suggested Responses */}
        {isCastingFiter && suggestedResponses && suggestedResponses.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedResponses.map((response, index) => (
              <button
                key={index}
                onClick={() => onSuggestedResponseClick?.(response)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
              >
                {response}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 