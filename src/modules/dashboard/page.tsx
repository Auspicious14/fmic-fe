"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Search, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useVoiceCapture, type VoiceResult } from "@/modules/voice/hooks/useVoiceCapture";
import { SummaryCards } from "./components/SummaryCards";
import { RecentActivity } from "./components/RecentActivity";
import { VoiceButton } from "./components/VoiceButton";
import { InterpretationPreview } from "@/modules/voice/components/InterpretationPreview";
import { BottomNav } from "@/components/ui/BottomNav";
import apiClient from "@/shared/lib/api-client";
import { todayLabel, cn } from "@/shared/lib/utils";
import { CustomerChip } from "./components/CustomerChip";
import { Customer } from "@/modules/customers/index";

interface AppUser {
  name?: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return getErrorMessage(error, fallback);
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [dashboardTab, setDashboardTab] = useState<"activity" | "debtors">("activity");

  useEffect(() => {
    setMounted(true);
  }, []);

  const [interpretation, setInterpretation] = useState<VoiceResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmedTransactions, setConfirmedTransactions] = useState<number[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const lastUploadedBlob = useRef<Blob | null>(null);

  const {
    audioBlob,
    durationMs,
    recordingState,
    levelHint,
    errorMessage,
    startRecording,
    stopRecording,
    processAudio,
    playAudioBase64,
    playTTS,
  } = useVoiceCapture();

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("fmic_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const storedUser = localStorage.getItem("fmic_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, [router]);

  // Load top debtors
  useEffect(() => {
    if (!user) return;
    apiClient
      .get("/customers?sortBy=totalDebt&limit=6")
      .then((r) => setTopCustomers(r.data?.customers ?? r.data ?? []))
      .catch(() => {});
  }, [user]);

  // Voice toggle
  const handleVoiceToggle = useCallback(async () => {
    if (recordingState === "recording") {
      try {
        await stopRecording();
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Recording failed"));
      }
      return;
    }

    if (
      recordingState === "requesting_permission" ||
      recordingState === "ready_to_upload" ||
      recordingState === "uploading" ||
      recordingState === "processing"
    ) {
      return;
    }

    try {
      await startRecording();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not access microphone"));
    }
  }, [recordingState, startRecording, stopRecording]);

  useEffect(() => {
    if (recordingState === "too_short") {
      toast.info("Speak again. That clip was too short.");
    }
    if (recordingState === "too_noisy") {
      toast.error("Too much noise. Move the phone closer and try again.");
    }
    if (recordingState === "error" && errorMessage) {
      toast.error(errorMessage);
    }
  }, [recordingState, errorMessage]);

  useEffect(() => {
    if (
      recordingState !== "ready_to_upload" ||
      !audioBlob ||
      lastUploadedBlob.current === audioBlob
    ) {
      return;
    }

    lastUploadedBlob.current = audioBlob;

    const uploadAudio = async () => {
      try {
        const result: VoiceResult = await processAudio(audioBlob);
        const firstIntent = result.transactions?.[0]?.intent;

        if (!result.transactions?.length || firstIntent === "UNCLEAR") {
          if (result.confirmationAudio) {
            await playAudioBase64(result.confirmationAudio).catch(() => {});
          } else {
            const lang = result.detectedLanguage === "yo" ? "yo-NG" : "pcm-NG";
            await playTTS("I no hear you well. Abeg talk again.", lang).catch(() => {});
          }
          toast.error("I no hear you well. Abeg talk again.");
          return;
        }

        setInterpretation(result);
        setShowPreview(true);

        if (result.confirmationAudio) {
          await playAudioBase64(result.confirmationAudio).catch(() => {});
        }
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to process audio"));
      }
    };

    void uploadAudio();
  }, [audioBlob, recordingState, processAudio, playAudioBase64, playTTS]);

  // Confirm transaction
  const handleConfirm = useCallback(
    async (index: number, overrideCustomerId?: string) => {
      if (!interpretation) return;
      const tx = interpretation.transactions[index];
      const ttsLang = interpretation.detectedLanguage === "yo" ? "yo-NG" : "pcm-NG";

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
        let finalCustomerId = overrideCustomerId ?? resolvedCustomer.customerId;

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

          if (tx.voice_confirmation) {
            if (interpretation.confirmationAudio) {
              await playAudioBase64(interpretation.confirmationAudio).catch(() => {});
            } else {
              await playTTS(tx.voice_confirmation, ttsLang).catch(() => {});
            }
          }

          setTimeout(() => window.location.reload(), 800);
        }
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to save transaction"));
      } finally {
        setIsConfirming(false);
      }
    },
    [interpretation, confirmedTransactions, playAudioBase64, playTTS]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("fmic_token");
    localStorage.removeItem("fmic_user");
    router.push("/login");
  }, [router]);

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
            <div className="flex-1">
              <div className="fcim-greeting">
                Ẹ káàbọ̀,{" "}
                <span className="fcim-greeting-name font-syne font-black">{firstName}</span>
              </div>
              <div className="fcim-subtext mt-1.5 font-bold text-[10px] text-muted/60 tracking-[0.2em] uppercase">
                Iṣowo rẹ wa nibi
              </div>
            </div>
            <div className="fcim-header-actions">
              <ThemeToggle />
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

        <div className="fcim-tabs mt-8">
          <button
            className={cn("fcim-tab", dashboardTab === "activity" && "active")}
            onClick={() => setDashboardTab("activity")}
          >
            Recent Activity
          </button>
          <button
            className={cn("fcim-tab", dashboardTab === "debtors" && "active")}
            onClick={() => setDashboardTab("debtors")}
          >
            Top Debtors
          </button>
        </div>

        <div className="fcim-tab-content">
          <div className="px-6 mb-4 mt-2">
            <h3 className="text-base font-black text-foreground tracking-tight font-syne uppercase">
              {dashboardTab === "activity" ? "Recent Activity" : "Top Debtors"}
            </h3>
          </div>
          {dashboardTab === "activity" ? (
            <section className="fcim-activity-bottom-pad">
              <RecentActivity />
              <div className="px-6 -mt-24 mb-32 relative z-10">
                <button 
                  onClick={() => router.push("/history")}
                  className="w-full py-4 bg-surface border border-border rounded-2xl text-xs font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                >
                  View All Activity
                </button>
              </div>
            </section>
          ) : (
            <section className="fcim-activity-bottom-pad">
              {topCustomers.length > 0 ? (
                <>
                  {topCustomers.map((c) => (
                    <CustomerChip key={c._id} customer={c} />
                  ))}
                  <div className="px-6 mt-4">
                    <button 
                      onClick={() => router.push("/customers")}
                      className="w-full py-4 bg-surface border border-border rounded-2xl text-xs font-black uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                    >
                      View All Customers
                    </button>
                  </div>
                </>
              ) : (
                <div className="fcim-empty mx-6 mt-8">
                  <p className="fcim-empty-title text-muted">
                    No debtors found
                  </p>
                  <p className="text-xs text-muted/60 mt-2 font-medium">
                    Your customers are all cleared!
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <VoiceButton
        state={recordingState}
        onClick={handleVoiceToggle}
        durationMs={durationMs}
        levelHint={levelHint}
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
    </>
  );
}
