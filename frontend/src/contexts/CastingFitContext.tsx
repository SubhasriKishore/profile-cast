import React, { createContext, useContext, useState, useEffect } from 'react';

interface CastingFitContextType {
  requirements: string;
  setRequirements: (requirements: string) => void;
  skillsContext: string;
  setSkillsContext: (skillsContext: string) => void;
  error: string;
  setError: (error: string) => void;
  reconnectAttempts: number;
  setReconnectAttempts: (attempts: number) => void;
  resetState: () => void;
}

const initialState = {
  requirements: '',
  skillsContext: '',
  error: '',
  reconnectAttempts: 0
};

const CastingFitContext = createContext<CastingFitContextType | undefined>(undefined);

export const CastingFitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('castingFitState');
      return savedState ? JSON.parse(savedState) : initialState;
    }
    return initialState;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('castingFitState', JSON.stringify(state));
    }
  }, [state]);

  const setRequirements = (requirements: string) => {
    setState(prev => ({ ...prev, requirements }));
  };

  const setSkillsContext = (skillsContext: string) => {
    setState(prev => ({ ...prev, skillsContext }));
  };

  const setError = (error: string) => {
    setState(prev => ({ ...prev, error }));
  };

  const setReconnectAttempts = (reconnectAttempts: number) => {
    setState(prev => ({ ...prev, reconnectAttempts }));
  };

  const resetState = () => {
    setState(initialState);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('castingFitState');
    }
  };

  const value = {
    ...state,
    setRequirements,
    setSkillsContext,
    setError,
    setReconnectAttempts,
    resetState
  };

  return (
    <CastingFitContext.Provider value={value}>
      {children}
    </CastingFitContext.Provider>
  );
};

export const useCastingFit = () => {
  const context = useContext(CastingFitContext);
  if (context === undefined) {
    throw new Error('useCastingFit must be used within a CastingFitProvider');
  }
  return context;
}; 