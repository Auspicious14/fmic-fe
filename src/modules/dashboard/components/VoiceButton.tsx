"use client";

import React from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { RecordingState } from "@/modules/voice/hooks/useVoiceCapture";

interface VoiceButtonProps {
  state: RecordingState;
  onClick: () => void;
  durationMs: number;
  levelHint: string;
}

export function VoiceButton({
  state,
  onClick,
  durationMs,
  levelHint,
}: VoiceButtonProps) {
  const isRecording = state === "recording";
  const isProcessing =
    state === "requesting_permission" ||
    state === "processing" ||
    state === "uploading";

  let hint = "Tap to speak";
  if (state === "requesting_permission") hint = "Opening mic...";
  if (isRecording) hint = "Tap to stop";
  if (state === "too_short") hint = "Speak again";
  if (state === "too_noisy") hint = "Move closer";
  if (state === "ready_to_upload") hint = "Preparing...";
  if (state === "uploading" || state === "processing") hint = "Processing...";

  const btnStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: isRecording ? "var(--danger)" : isProcessing ? "var(--foreground)" : "var(--accent)",
    border: "none",
    cursor: isProcessing ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.15s, background 0.2s",
  };

  return (
    <div className="fcim-voice-zone">
      {isRecording && (
        <div className="fcim-recording-row">
          <div className="fcim-rec-dot" />
          <span className="fcim-rec-label">
            {levelHint} · {Math.ceil(durationMs / 1000)}s
          </span>
        </div>
      )}

      <button
        style={btnStyle}
        onClick={onClick}
        disabled={isProcessing}
        className={cn("text-background", isRecording && "btn-pulse")}
      >
        {isProcessing ? (
          <Loader2
            size={28}
            className="spin"
            style={{ stroke: "#888" }}
          />
        ) : isRecording ? (
          <Square size={24} fill="#fff" stroke="#fff" />
        ) : (
          <Mic size={28} stroke="currentColor" strokeWidth={2} />
        )}
      </button>

      <span className="fcim-voice-hint">{hint}</span>
    </div>
  );
}
