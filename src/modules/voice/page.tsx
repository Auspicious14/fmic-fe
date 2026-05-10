"use client";

import React, { useState } from 'react';
import { VoiceButton } from './components/VoiceButton';
import { useVoiceCapture } from './hooks/useVoiceCapture';
import { Card } from '@/components/ui/Card';

export default function VoicePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, startRecording, stopRecording } = useVoiceCapture();

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
      setIsProcessing(true);
      // Simulate processing
      setTimeout(() => setIsProcessing(false), 2000);
    } else {
      startRecording();
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Voice Commands</h1>
        <p className="text-muted-foreground text-sm">
          Speak to add transactions, update prices, or manage customers.
        </p>
      </header>

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Instructions</h2>
          <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
            <li>"Add 5 bags of cement to John Doe"</li>
            <li>"Update price of sand to 2500"</li>
            <li>"Show history for Mary Jane"</li>
          </ul>
        </div>
      </Card>

      {/* InterpretationPreview placeholder */}
      {isProcessing && (
        <Card className="p-6 border-accent animate-pulse">
          <p className="text-accent font-bold">Analyzing your request...</p>
        </Card>
      )}

      <VoiceButton 
        isRecording={isRecording}
        isProcessing={isProcessing}
        onClick={handleToggleRecording}
      />
    </div>
  );
}
