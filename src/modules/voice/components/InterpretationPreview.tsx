
"use client";

import React, { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';
import { Check, X, User, ShoppingBag, CreditCard, AlertCircle, UserPlus, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InterpretationPreviewProps {
  data: any; // VoiceOutputDto containing transactions array
  isOpen: boolean;
  onConfirm: (transactionIndex: number, customerId?: string) => void;
  onCancel: () => void;
  onEdit: (transactionIndex: number) => void;
  isLoading?: boolean;
}

export function InterpretationPreview({ data, isOpen, onConfirm, onCancel, onEdit, isLoading }: InterpretationPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !data?.transactions || data.transactions.length === 0) return null;

  const currentTx = data.transactions[currentIndex];
  const isLast = currentIndex === data.transactions.length - 1;

  const handleNext = (customerId?: string) => {
    onConfirm(currentIndex, customerId);
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl"
        >
          <div className="p-10 pb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Entry {currentIndex + 1} of {data.transactions.length}
                </h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                  Check and confirm
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                {Math.round(currentTx.confidence_score * 100)}% Sure
              </div>
            </div>

            <div className="space-y-6">
              {/* Customer Resolution */}
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${currentTx.resolvedCustomer.isNew ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                  {currentTx.resolvedCustomer.isNew ? <UserPlus className="w-7 h-7" /> : <User className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Customer</p>
                  <p className="text-2xl font-black text-slate-900 leading-none">
                    {currentTx.resolvedCustomer.name}
                    {currentTx.resolvedCustomer.tag && (
                      <span className="ml-2 text-sm text-slate-400 font-bold">({currentTx.resolvedCustomer.tag})</span>
                    )}
                  </p>
                  
                  {currentTx.resolvedCustomer.isNew && (
                    <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-wider">New customer will be created</p>
                    </div>
                  )}

                  {currentTx.resolvedCustomer.isAmbiguous && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Did you mean?</p>
                      {currentTx.resolvedCustomer.potentialMatches.map((match: any) => (
                        <button
                          key={match.id}
                          onClick={() => handleNext(match.id)}
                          className="w-full text-left p-3 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex justify-between items-center group"
                        >
                          <span className="font-bold text-slate-700 group-hover:text-emerald-700">{match.name} {match.tag && `(${match.tag})`}</span>
                          <Check className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Items / Details / Summary */}
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${
                  currentTx.intent === 'PAYMENT' ? 'bg-emerald-50 text-emerald-500' : 
                  currentTx.intent === 'DAILY_SUMMARY' ? 'bg-blue-50 text-blue-500' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  {currentTx.intent === 'PAYMENT' ? <CreditCard className="w-7 h-7" /> : 
                   currentTx.intent === 'DAILY_SUMMARY' ? <TrendingUp className="w-7 h-7" /> :
                   <ShoppingBag className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                    {currentTx.intent === 'PAYMENT' ? 'Payment Details' : 
                     currentTx.intent === 'DAILY_SUMMARY' ? 'Daily Summary' : 'Items'}
                  </p>
                  
                  {currentTx.intent === 'PAYMENT' ? (
                    <p className="text-4xl font-black text-emerald-600 leading-none">{formatCurrency(currentTx.total_amount)}</p>
                  ) : currentTx.intent === 'DAILY_SUMMARY' ? (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-slate-800 font-bold leading-relaxed">{currentTx.voice_confirmation}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentTx.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                          <p className="text-slate-800 font-bold">
                            <span className="text-slate-900 font-black">{item.quantity}x</span> {item.product_name}
                          </p>
                          <p className="font-black text-slate-900">{formatCurrency(item.unit_price)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100 my-4" />

              <div className="bg-slate-900 p-6 rounded-[32px] flex justify-between items-center shadow-lg">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">Total Value</p>
                <p className="text-3xl font-black text-white">
                  {formatCurrency(currentTx.total_amount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button variant="outline" size="lg" onClick={() => onEdit(currentIndex)} disabled={isLoading} className="w-full rounded-2xl font-bold border-2">
                Edit
              </Button>
              <Button variant="danger" size="lg" onClick={onCancel} disabled={isLoading} className="w-full rounded-2xl font-bold">
                Cancel All
              </Button>
            </div>
            
            {!currentTx.resolvedCustomer.isAmbiguous && (
              <Button 
                variant="primary" 
                size="xl" 
                onClick={() => handleNext()} 
                isLoading={isLoading}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200"
              >
                {!isLoading && <Check className="w-7 h-7 mr-2" />} 
                {isLast ? 'Confirm & Save' : 'Next Entry'}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
