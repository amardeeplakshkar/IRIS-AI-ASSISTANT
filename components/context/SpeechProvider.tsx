'use client';

import React, { createContext, useContext, useState } from 'react';

type SpeechContextType = {
  isSpeaking: boolean;
  setIsSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  isListening: boolean;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
};

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  return (
    <SpeechContext.Provider value={{ isSpeaking, setIsSpeaking, isListening, setIsListening }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeechContext = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeechContext must be used within a SpeechProvider');
  }
  return context;
};
