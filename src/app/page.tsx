"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SummaryCards } from '@/modules/dashboard/components/SummaryCards';
import { RecentActivity } from '@/modules/dashboard/components/RecentActivity';
import { VoiceButton } from '@/modules/voice/components/VoiceButton';
import { InterpretationPreview } from '@/modules/voice/components/InterpretationPreview';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Bell, Search, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceCapture } from '@/modules/voice/hooks/useVoiceCapture';
import apiClient from '@/shared/lib/api-client';

export default function Home() {
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [interpretation, setInterpretation] = useState<any>(null);
  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    processAudio,
    playTTS,
  } = useVoiceCapture();
  const [user, setUser] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fmic_token');
    if (!token) {
      router.push('/login');
    } else {
      const storedUser = localStorage.getItem('fmic_user');
      if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleVoiceToggle = async () => {
    if (!isRecording) {
      try {
        await startRecording();
      } catch (err: any) {
        toast.error(err.message);
      }
    } else {
      try {
        const audioBlob = await stopRecording();
        const result = await processAudio(audioBlob);
        if (result.intent === 'UNKNOWN') {
          toast.error("I didn't quite catch that. Try again?");
        } else {
          setInterpretation(result);
          setShowPreview(true);
        }
      } catch (err: any) {
        toast.error("Failed to process audio");
      }
    }
  };

  const [confirmedTransactions, setConfirmedTransactions] = useState<any[]>([]);

  const handleConfirm = async (index: number, overrideCustomerId?: string) => {
    const tx = interpretation.transactions[index];
    const resolvedCustomer = tx.resolvedCustomer;
    
    // 0. If it's a daily summary request, just play it and move on
    if (tx.intent === 'DAILY_SUMMARY') {
      const newConfirmed = [...confirmedTransactions, index];
      setConfirmedTransactions(newConfirmed);
      
      if (tx.voice_confirmation) {
        await playTTS(tx.voice_confirmation);
      }

      if (newConfirmed.length === interpretation.transactions.length) {
        setShowPreview(false);
        setConfirmedTransactions([]);
      }
      return;
    }

    let finalCustomerId = overrideCustomerId || resolvedCustomer.customerId;

    try {
      // 1. If it's a new customer, create them first
      if (resolvedCustomer.isNew && !finalCustomerId) {
        const customerResponse = await apiClient.post('/customers', {
          name: resolvedCustomer.name,
          tag: resolvedCustomer.tag,
        });
        finalCustomerId = customerResponse.data._id;
      }

      const payload = {
        customerId: finalCustomerId,
        items: tx.items.map((item: any) => ({
          productName: item.product_name,
          productId: item.product_id,
          quantity: item.quantity,
          unitPriceAtSale: item.unit_price,
        })),
        amount: tx.amount, // Include direct amount if present
        type: tx.transaction_type,
        voiceTranscript: tx.reasoning_summary,
        idempotencyKey: crypto.randomUUID(),
      };
      
      await apiClient.post('/transactions', payload);
      
      const newConfirmed = [...confirmedTransactions, index];
      setConfirmedTransactions(newConfirmed);

      if (newConfirmed.length === interpretation.transactions.length) {
        setShowPreview(false);
        toast.success('All transactions saved successfully!');
        
        // Play TTS confirmation for the last one or a summary
        if (tx.voice_confirmation) {
          try {
            await playTTS(tx.voice_confirmation);
          } catch (ttsErr) {
            console.warn('TTS playback failed, but transaction saved:', ttsErr);
          }
        }

        // Short delay to ensure user registers the final state
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleEdit = (index: number) => {
    // Implement edit logic or redirect to a manual form
    toast.info("Edit mode coming soon");
  };

  const handleLogout = () => {
    localStorage.removeItem('fmic_token');
    localStorage.removeItem('fmic_user');
    router.push('/login');
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
    </div>
  );

  return (
    <div className="pt-8 min-h-screen">
      <header className="px-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
            Hello, {user.name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">
            Your shop's memory is ready
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-rose-500 active:scale-95 transition-transform">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <SummaryCards />
      
      <div className="mt-10">
        <RecentActivity />
      </div>

      <VoiceButton 
        isRecording={isRecording} 
        isProcessing={isProcessing}
        onClick={handleVoiceToggle} 
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
          onEdit={handleEdit}
          isLoading={isConfirming}
        />
      )}

      <BottomNav />
    </div>
  );
}
