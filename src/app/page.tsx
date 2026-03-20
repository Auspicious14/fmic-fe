// "use client";

// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { SummaryCards } from "@/modules/dashboard/components/SummaryCards";
// import { RecentActivity } from "@/modules/dashboard/components/RecentActivity";
// import { VoiceButton } from "@/modules/voice/components/VoiceButton";
// import { InterpretationPreview } from "@/modules/voice/components/InterpretationPreview";
// import { BottomNav } from "@/shared/ui/BottomNav";
// import { Bell, Search, LogOut, Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { useVoiceCapture } from "@/modules/voice/hooks/useVoiceCapture";
// import apiClient from "@/shared/lib/api-client";

// export default function Home() {
//   const router = useRouter();
//   const [showPreview, setShowPreview] = useState(false);
//   const [interpretation, setInterpretation] = useState<any>(null);
//   const [user, setUser] = useState<any>(null);
//   const [isConfirming, setIsConfirming] = useState(false);

//   const {
//   isRecording,
//   isProcessing,
//   startRecording,
//   stopRecording,
//   processAudio,
//   playAudioBase64,  //
//   playTTS,
// } = useVoiceCapture();

//   useEffect(() => {
//     const token = localStorage.getItem("fmic_token");
//     if (!token) {
//       router.push("/login");
//     } else {
//       const storedUser = localStorage.getItem("fmic_user");
//       if (storedUser) setUser(JSON.parse(storedUser));
//     }
//   }, [router]);

  
// const handleVoiceToggle = async () => {
//   if (!isRecording) {
//     try {
//       await startRecording();
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   } else {
//     try {
//       const audioBlob = await stopRecording();
//       const result = await processAudio(audioBlob);

//       const firstIntent = result.transactions?.[0]?.intent;

//       if (!result.transactions?.length || firstIntent === 'UNCLEAR') {
//         // Play Yoruba/Pidgin "try again" audio if available, else toast
//         if (result.confirmationAudio) {
//           await playAudioBase64(result.confirmationAudio);
//         } else {
//           toast.error("I no hear you well. Abeg talk again.");
//         }
//         return;
//       }

//       setInterpretation(result);
//       setShowPreview(true);

//       // Auto-play confirmation audio immediately if available
//       // No extra API call needed — audio already in response
//       if (result.confirmationAudio) {
//         await playAudioBase64(result.confirmationAudio);
//       }

//     } catch (err: any) {
//       toast.error(err.message ?? "Failed to process audio");
//     }
//   }
// };

// const handleConfirm = async (index: number, overrideCustomerId?: string) => {
//   const tx = interpretation.transactions[index];
//   const ttsLang = interpretation.detectedLanguage === 'yo' ? 'yo-NG' : 'pcm-NG';
  
//   // ... existing confirm logic ...

//   // Replace playTTS(tx.voice_confirmation) with language-aware version:
//   if (tx.voice_confirmation) {
//     try {
//       // Use pre-fetched audio if available, otherwise fetch on demand
//       if (interpretation.confirmationAudio) {
//         await playAudioBase64(interpretation.confirmationAudio);
//       } else {
//         await playTTS(tx.voice_confirmation, ttsLang);
//       }
//     } catch (ttsErr) {
//       console.warn('TTS playback failed, but transaction saved:', ttsErr);
//     }
//   }
// };
  
  
  
  
  
  
  
  
  
  
  
  
  
  

//   const [confirmedTransactions, setConfirmedTransactions] = useState<any[]>([]);















  
  

  
  

  

  

  

//   const handleEdit = (index: number) => {
//     // Implement edit logic or redirect to a manual form
//     toast.info("Edit mode coming soon");
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("fmic_token");
//     localStorage.removeItem("fmic_user");
//     router.push("/login");
//   };

//   if (!user)
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
//       </div>
//     );

//   return (
//     <div className="pt-8 min-h-screen">
//       <header className="px-6 mb-8 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
//             Hello, {user.name.split(" ")[0]}
//           </h1>
//           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
//             Your shop's memory is ready
//           </p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button
//             onClick={handleLogout}
//             className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-rose-500 active:scale-95 transition-transform"
//           >
//             <LogOut className="w-5 h-5" />
//           </button>
//         </div>
//       </header>

//       <SummaryCards />

//       <div className="mt-10">
//         <RecentActivity />
//       </div>

//       <VoiceButton
//         isRecording={isRecording}
//         isProcessing={isProcessing}
//         onClick={handleVoiceToggle}
//       />

//       {interpretation && (
//         <InterpretationPreview
//           isOpen={showPreview}
//           data={interpretation}
//           onConfirm={handleConfirm}
//           onCancel={() => {
//             setShowPreview(false);
//             setConfirmedTransactions([]);
//           }}
//           onEdit={handleEdit}
//           isLoading={isConfirming}
//         />
//       )}

//       <BottomNav />
//     </div>
//   );
// }


"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LogOut,
  Search,
  Mic,
  Square,
  Loader2,
  Plus,
  CheckCheck,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useVoiceCapture } from "@/modules/voice/hooks/useVoiceCapture";
import { SummaryCards } from "@/modules/dashboard/components/SummaryCards";
import { RecentActivity } from "@/modules/dashboard/components/RecentActivity";
import { InterpretationPreview } from "@/modules/voice/components/InterpretationPreview";
import { BottomNav } from "@/shared/ui/BottomNav";
import apiClient from "@/shared/lib/api-client";
import { avatarPalette, formatNaira, todayLabel } from "@/shared/lib/utils";
import { CustomerChip } from "@/modules/dashboard/components/CustomerChip";
import { Customer } from "@/shared/types";

interface Transaction {
  intent: string;
  resolvedCustomer: {
    name: string;
    isNew: boolean;
    isAmbiguous: boolean;
    customerId?: string;
    tag?: string;
  };
  items: any[];
  total_amount: number;
  amount?: number;
  transaction_type: string;
  confidence_score: number;
  reasoning_summary: string;
  voice_confirmation: string;
}

interface VoiceResult {
  transactions: Transaction[];
  overall_transcript: string;
  detectedLanguage?: "yo" | "en" | "mixed";
  confirmationAudio?: string | null;
}



type VoiceState = "idle" | "recording" | "processing";

function VoiceButton({
  state,
  onClick,
  recordingDuration,
}: {
  state: VoiceState;
  onClick: () => void;
  recordingDuration: number;
}) {
  const isRecording = state === "recording";
  const isProcessing = state === "processing";

  let hint = "Tap to speak";
  if (isRecording) hint = "Tap to stop";
  if (isProcessing) hint = "Processing...";

  let btnStyle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: isRecording ? "#EF4444" : isProcessing ? "#1A1A1A" : "#F4A931",
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
            Recording {recordingDuration}s
          </span>
        </div>
      )}

      <button
        style={btnStyle}
        onClick={onClick}
        disabled={isProcessing}
        className={isRecording ? "btn-pulse" : ""}
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
          <Mic size={28} stroke="#0A0A0A" strokeWidth={2} />
        )}
      </button>

      <span className="fcim-voice-hint">{hint}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [interpretation, setInterpretation] = useState<VoiceResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmedTransactions, setConfirmedTransactions] = useState<number[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    processAudio,
    playAudioBase64,
    playTTS,
  } = useVoiceCapture();

  // ── Auth check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("fmic_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedUser = localStorage.getItem("fmic_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, [router]);

  // ── Load top debtors ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/customers?sortBy=totalDebt&limit=6")
      .then((r) => setTopCustomers(r.data?.customers ?? r.data ?? []))
      .catch(() => {});
  }, [user]);

  // ── Recording timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRecording) {
      setRecordingDuration(0);
      return;
    }
    const interval = setInterval(
      () => setRecordingDuration((d) => d + 1),
      1000
    );
    return () => clearInterval(interval);
  }, [isRecording]);

  // ── Voice toggle ─────────────────────────────────────────────────────────────
  const handleVoiceToggle = useCallback(async () => {
    if (voiceState === "idle") {
      try {
        await startRecording();
        setVoiceState("recording");
      } catch (err: any) {
        toast.error(err.message ?? "Could not access microphone");
      }
      return;
    }

    if (voiceState === "recording") {
      try {
        const audioBlob = await stopRecording();
        setVoiceState("processing");

        const result: VoiceResult = await processAudio(audioBlob);
        const firstIntent = result.transactions?.[0]?.intent;

        if (!result.transactions?.length || firstIntent === "UNCLEAR") {
          // Play "try again" audio confirmation if available
          if (result.confirmationAudio) {
            await playAudioBase64(result.confirmationAudio).catch(() => {});
          } else {
            const lang = result.detectedLanguage === "yo" ? "yo-NG" : "pcm-NG";
            await playTTS(
              "I no hear you well. Abeg talk again.",
              lang
            ).catch(() => {});
          }
          toast.error("I no hear you well. Abeg talk again.");
          setVoiceState("idle");
          return;
        }

        setInterpretation(result);
        setShowPreview(true);

        // Auto-play confirmation audio — already in response, no extra call
        if (result.confirmationAudio) {
          await playAudioBase64(result.confirmationAudio).catch(() => {});
        }
      } catch (err: any) {
        toast.error(err.message ?? "Failed to process audio");
      } finally {
        setVoiceState("idle");
      }
    }
  }, [
    voiceState,
    startRecording,
    stopRecording,
    processAudio,
    playAudioBase64,
    playTTS,
  ]);

  // ── Confirm transaction ──────────────────────────────────────────────────────
  const handleConfirm = useCallback(
    async (index: number, overrideCustomerId?: string) => {
      if (!interpretation) return;
      const tx = interpretation.transactions[index];
      const ttsLang =
        interpretation.detectedLanguage === "yo" ? "yo-NG" : "pcm-NG";

      // Daily summary — just play and dismiss
      if (tx.intent === "DAILY_SUMMARY") {
        const newConfirmed = [...confirmedTransactions, index];
        setConfirmedTransactions(newConfirmed);
        if (tx.voice_confirmation) {
          await playTTS(tx.voice_confirmation, ttsLang).catch(() => {});
        }
        if (newConfirmed.length === interpretation.transactions.length) {
          setShowPreview(false);
          setConfirmedTransactions([]);
        }
        return;
      }

      setIsConfirming(true);
      try {
        const resolvedCustomer = tx.resolvedCustomer;
        let finalCustomerId =
          overrideCustomerId ?? resolvedCustomer.customerId;

        // Create new customer if needed
        if (resolvedCustomer.isNew && !finalCustomerId) {
          const r = await apiClient.post("/customers", {
            name: resolvedCustomer.name,
            tag: resolvedCustomer.tag,
          });
          finalCustomerId = r.data._id;
        }

        await apiClient.post("/transactions", {
          customerId: finalCustomerId,
          items: tx.items.map((item: any) => ({
            productName: item.product_name,
            productId: item.product_id,
            quantity: item.quantity,
            unitPriceAtSale: item.unit_price,
          })),
          amount: tx.amount,
          type: tx.transaction_type,
          voiceTranscript: tx.reasoning_summary,
          idempotencyKey: crypto.randomUUID(),
        });

        const newConfirmed = [...confirmedTransactions, index];
        setConfirmedTransactions(newConfirmed);

        if (newConfirmed.length === interpretation.transactions.length) {
          setShowPreview(false);
          setConfirmedTransactions([]);
          toast.success("Transaction saved!");

          // Play TTS — use pre-fetched audio or fallback to TTS endpoint
          if (tx.voice_confirmation) {
            if (interpretation.confirmationAudio) {
              await playAudioBase64(interpretation.confirmationAudio).catch(
                () => {}
              );
            } else {
              await playTTS(tx.voice_confirmation, ttsLang).catch(() => {});
            }
          }

          setTimeout(() => window.location.reload(), 800);
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ?? "Failed to save transaction"
        );
      } finally {
        setIsConfirming(false);
      }
    },
    [
      interpretation,
      confirmedTransactions,
      playAudioBase64,
      playTTS,
    ]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("fmic_token");
    localStorage.removeItem("fmic_user");
    router.push("/login");
  }, [router]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!user || !mounted) {
    return (
      <div className="fcim-splash">
        <Loader2 className="spin" size={36} style={{ stroke: "#F4A931" }} />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] ?? "Shop Owner";

  return (
    <>


      <div className="fcim-page">
        <header className="fcim-header">
          <div className="fcim-header-top">
            <div>
              <div className="fcim-greeting">
                Ẹ káàbọ̀,{" "}
                <span className="fcim-greeting-name">{firstName}</span>
              </div>
              <div className="fcim-subtext">Iṣowo rẹ wa nibi</div>
            </div>
            <div className="fcim-header-actions">
              <button
                className="fcim-icon-btn"
                title="Toggle Theme"
                onClick={toggleTheme}
              >
                {mounted && (theme === "dark" ? <Sun size={18} /> : <Moon size={18} />)}
              </button>
              <button className="fcim-icon-btn" title="Search">
                <Search size={18} />
              </button>
              <button
                className="fcim-icon-btn"
                title="Logout"
                onClick={handleLogout}
                style={{ color: "#EF4444" }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <div className="fcim-date-badge">
            <div className="fcim-date-dot" />
            {todayLabel()}
          </div>
        </header>

        <section className="fcim-section">
          <SummaryCards />
        </section>

        {topCustomers.length > 0 && (
          <section className="fcim-section">
            <div className="fcim-section-header">
              <span className="fcim-section-title">Top Debtors</span>
              <span className="fcim-see-all">See all</span>
            </div>
            <div className="fcim-customers-scroll">
              {topCustomers.map((c) => (
                <CustomerChip key={c.id} customer={c} />
              ))}
            </div>
          </section>
        )}

        <section className="fcim-section fcim-activity-bottom-pad">
          <div className="fcim-section-header">
            <span className="fcim-section-title">Recent Activity</span>
            <span className="fcim-see-all">Filter</span>
          </div>
          <RecentActivity />
        </section>

        <VoiceButton
          state={voiceState}
          onClick={handleVoiceToggle}
          recordingDuration={recordingDuration}
        />

        {interpretation && (
          <InterpretationPreview
            isOpen={showPreview}
            data={interpretation}
            onConfirm={handleConfirm}
            onCancel={() => {
              setShowPreview(false);
              setConfirmedTransactions([]);
            }}
            onEdit={() => toast.info("Edit mode coming soon")}
            isLoading={isConfirming}
          />
        )}

        <BottomNav />
      </div>
    </>
  );
}