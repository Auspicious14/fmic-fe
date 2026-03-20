"use client";

import React from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface VoiceButtonProps {
  isRecording?: boolean;
  isProcessing?: boolean;
  onClick?: () => void;
}

export function VoiceButton({ isRecording, isProcessing, onClick }: VoiceButtonProps) {
  return (
    <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50">
      <AnimatePresence>
        {(isRecording || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-surface border border-border px-5 py-2.5 rounded-[14px] shadow-2xl whitespace-nowrap"
          >
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-[2px] font-sans",
              isRecording ? "text-danger animate-pulse" : "text-accent"
            )}>
              {isRecording ? "Listening..." : "Processing..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
        transition={isRecording ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : {}}
        onClick={onClick}
        disabled={isProcessing}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl",
          isRecording 
            ? "bg-danger text-white btn-pulse" 
            : isProcessing 
              ? "bg-elevated text-muted" 
              : "bg-accent text-background"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 animate-spin" />
        ) : (
          <Mic className={cn("w-8 h-8", isRecording && "animate-pulse")} />
        )}
      </motion.button>
    </div>
  );
}
