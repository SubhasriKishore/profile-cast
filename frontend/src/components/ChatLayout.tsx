import React, { useState } from 'react';
import { Avatar } from './ui/Avatar';
import { Sidebar } from './ui/Sidebar';
import { AICastingFiter } from './AICastingFiter';

interface ChatLayoutProps {
  children: React.ReactNode;
  candidateProfile?: {
    name: string;
    role?: string;
    experience?: string;
    skills?: string[];
    resumeUrl?: string;
  };
  onUserResponse: (response: string) => void;
  isCastingFiting: boolean;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ 
  children, 
  candidateProfile,
  onUserResponse,
  isCastingFiting 
}) => {
  const [showTranscript, setShowTranscript] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar className="w-80 hidden lg:block flex-shrink-0">
        <div className="p-4 space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar size="lg" name={candidateProfile?.name || 'Candidate'} />
              <div>
                <h2 className="font-semibold text-gray-900">{candidateProfile?.name || 'Candidate'}</h2>
                <p className="text-sm text-gray-500">{candidateProfile?.role || 'Role not specified'}</p>
              </div>
            </div>
            
            {/* Skills */}
            {candidateProfile?.skills && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {candidateProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {candidateProfile?.experience && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Experience</h3>
                <p className="text-sm text-gray-600">{candidateProfile.experience}</p>
              </div>
            )}

            {/* Resume Link */}
            {candidateProfile?.resumeUrl && (
              <a
                href={candidateProfile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <span className="material-icons text-sm mr-1">description</span>
                View Resume
              </a>
            )}
          </div>

          {/* CastingFit Controls */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3">CastingFit Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Show Transcript</span>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showTranscript ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showTranscript ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Sidebar>

      {/* Main CastingFit Area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AICastingFiter
            isCastingFiting={isCastingFiting}
            onUserResponse={onUserResponse}
            status={''}
          />
          {showTranscript && (
            <div className="mt-8 w-full max-w-3xl">
              {children}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}; 