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
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-slate-100 whitespace-nowrap"
          >
            <p className={cn(
              "text-sm font-black uppercase tracking-widest",
              isRecording ? "text-rose-500 animate-pulse" : "text-blue-500"
            )}>
              {isRecording ? "Listening..." : "Thinking..."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
        transition={isRecording ? { repeat: Infinity, duration: 1.5 } : {}}
        onClick={onClick}
        disabled={isProcessing}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all",
          isRecording ? "bg-rose-500 text-white" : isProcessing ? "bg-blue-500 text-white" : "bg-slate-900 text-white"
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
