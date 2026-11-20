
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/shared/lib/utils';
import { Check, X, User, ShoppingBag, CreditCard, AlertCircle, UserPlus, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Passed to onConfirm when the trader says the heard name is a new customer. */
export const NEW_CUSTOMER = "__new_customer__";

interface InterpretationPreviewProps {
  data: any; // VoiceOutputDto containing transactions array
  isOpen: boolean;
  /** amountOverride: the total the trader typed when no price was heard. */
  onConfirm: (transactionIndex: number, customerId?: string, amountOverride?: number) => void;
  onCancel: () => void;
  onEdit: (transactionIndex: number) => void;
  isLoading?: boolean;
}

export function InterpretationPreview({ data, isOpen, onConfirm, onCancel, onEdit, isLoading }: InterpretationPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Totals typed by the trader for sales heard without a price, per entry.
  const [typedTotals, setTypedTotals] = useState<Record<number, string>>({});

  if (!isOpen || !data?.transactions || data.transactions.length === 0) return null;

  const currentTx = data.transactions[currentIndex];
  const isLast = currentIndex === data.transactions.length - 1;

  const needsPrice =
    Boolean(currentTx.needs_price) ||
    (currentTx.intent === 'CREDIT_SALE' && !(currentTx.total_amount > 0));
  const typedTotal = Number((typedTotals[currentIndex] ?? '').replace(/[^\d.]/g, ''));
  const priceMissing = needsPrice && !(typedTotal > 0);
  const shownTotal = needsPrice ? (typedTotal > 0 ? typedTotal : 0) : currentTx.total_amount;
  const warnings: string[] = (currentTx.warnings ?? []).filter(
    (w: string) => !(needsPrice && w.startsWith('No price')),
  );

  const handleNext = (customerId?: string) => {
    if (priceMissing) return; // never save a debt at ₦0
    onConfirm(currentIndex, customerId, needsPrice ? typedTotal : undefined);
    if (!isLast) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="w-full max-w-md bg-surface rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl border border-border"
        >
          <div className="p-10 pb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight font-syne">
                  Entry {currentIndex + 1} of {data.transactions.length}
                </h2>
                <p className="text-muted font-bold text-xs uppercase tracking-widest mt-1">
                  Check and confirm
                </p>
              </div>
              <div className="bg-success/10 text-success px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                {Math.round(currentTx.confidence_score * 100)}% Sure
              </div>
            </div>

            <div className="space-y-6">
              {/* Customer Resolution */}
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${currentTx.resolvedCustomer.isNew ? 'bg-accent/10 text-accent' : 'bg-elevated text-muted'}`}>
                  {currentTx.resolvedCustomer.isNew ? <UserPlus className="w-7 h-7" /> : <User className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Customer</p>
                  <p className="text-2xl font-black text-foreground leading-none font-syne">
                    {currentTx.resolvedCustomer.name}
                    {currentTx.resolvedCustomer.tag && (
                      <span className="ml-2 text-sm text-muted font-bold">({currentTx.resolvedCustomer.tag})</span>
                    )}
                  </p>
                  
                  {currentTx.resolvedCustomer.isNew && (
                    <div className="mt-3 flex items-center gap-2 text-accent bg-accent/5 p-2 rounded-lg border border-accent/10">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-wider">New customer will be created</p>
                    </div>
                  )}

                  {currentTx.resolvedCustomer.isAmbiguous && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">Did you mean?</p>
                      {currentTx.resolvedCustomer.potentialMatches.map((match: any) => (
                        <button
                          key={match.id}
                          onClick={() => handleNext(match.id)}
                          disabled={priceMissing}
                          className="w-full text-left p-3 rounded-xl border-2 border-border hover:border-success hover:bg-success/5 transition-all flex justify-between items-center group"
                        >
                          <span className="font-bold text-foreground group-hover:text-success">{match.name} {match.tag && `(${match.tag})`}</span>
                          <Check className="w-4 h-4 text-success opacity-0 group-hover:opacity-100" />
                        </button>
                      ))}
                      <button
                        onClick={() => handleNext(NEW_CUSTOMER)}
                        disabled={priceMissing}
                        className="w-full text-left p-3 rounded-xl border-2 border-dashed border-border hover:border-accent hover:bg-accent/5 transition-all"
                      >
                        <span className="font-bold text-foreground">
                          No, add &quot;{currentTx.resolvedCustomer.name}&quot; as a new customer
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items / Details / Summary */}
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-2xl ${
                  currentTx.intent === 'PAYMENT' ? 'bg-success/10 text-success' : 
                  currentTx.intent === 'DAILY_SUMMARY' ? 'bg-accent/10 text-accent' :
                  'bg-elevated text-muted'
                }`}>
                  {currentTx.intent === 'PAYMENT' ? <CreditCard className="w-7 h-7" /> : 
                   currentTx.intent === 'DAILY_SUMMARY' ? <TrendingUp className="w-7 h-7" /> :
                   <ShoppingBag className="w-7 h-7" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-3">
                    {currentTx.intent === 'PAYMENT' ? 'Payment Details' : 
                     currentTx.intent === 'DAILY_SUMMARY' ? 'Daily Summary' : 'Items'}
                  </p>
                  
                  {currentTx.intent === 'PAYMENT' ? (
                    <p className="text-4xl font-black text-success leading-none font-syne">{formatCurrency(currentTx.total_amount)}</p>
                  ) : currentTx.intent === 'DAILY_SUMMARY' ? (
                    <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10">
                      <p className="text-foreground font-bold leading-relaxed">{currentTx.voice_confirmation}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentTx.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center bg-elevated/50 p-3 rounded-xl border border-border">
                          <p className="text-muted font-bold">
                            <span className="text-foreground font-black">{item.quantity}x</span> {item.product_name}
                          </p>
                          <p className="font-black text-foreground">
                            {needsPrice && !(item.unit_price > 0) ? '—' : formatCurrency(item.unit_price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-border my-4" />

              {needsPrice && (
                <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-4 space-y-2">
                  <label htmlFor="typed-total" className="block font-bold text-foreground">
                    I didn&apos;t hear a price. What&apos;s the total?
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-muted">₦</span>
                    <input
                      id="typed-total"
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      placeholder="e.g. 9500"
                      value={typedTotals[currentIndex] ?? ''}
                      onChange={(e) =>
                        setTypedTotals((prev) => ({ ...prev, [currentIndex]: e.target.value }))
                      }
                      className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground text-xl font-black"
                    />
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div role="alert" className="rounded-2xl border border-accent/30 bg-accent/10 p-4 space-y-2">
                  {warnings.map((warning) => (
                    <p key={warning} className="flex gap-2 text-sm font-bold text-accent">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
                      <span>{warning}</span>
                    </p>
                  ))}
                </div>
              )}

              {typeof currentTx.balance_after === 'number' && !needsPrice && (
                <p className="text-sm font-bold text-muted">
                  {currentTx.resolvedCustomer.name} owes {formatCurrency(currentTx.current_balance ?? 0)} now
                  {' '}→ {currentTx.balance_after < 0
                    ? `${formatCurrency(-currentTx.balance_after)} in credit`
                    : formatCurrency(currentTx.balance_after)}{' '}
                  after this
                </p>
              )}

              <div className="bg-foreground p-6 rounded-[32px] flex justify-between items-center shadow-lg">
                <p className="font-bold text-background uppercase text-[10px] tracking-[0.2em] opacity-60">Total Value</p>
                <p className="text-3xl font-black text-background font-syne">
                  {formatCurrency(shownTotal)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <Button variant="outline" size="lg" onClick={() => onEdit(currentIndex)} disabled={isLoading} className="w-full rounded-2xl font-bold border-2">
                Edit
              </Button>
              <Button variant="danger" size="lg" onClick={onCancel} disabled={isLoading} className="w-full rounded-2xl font-bold">
                Cancel
              </Button>
            </div>
            
            {!currentTx.resolvedCustomer.isAmbiguous && (
              <Button 
                variant="primary" 
                size="xl" 
                onClick={() => handleNext()} 
                isLoading={isLoading}
                disabled={priceMissing}
                className="w-full mt-4 bg-success hover:bg-success/90 shadow-xl shadow-success/20"
              >
                {!isLoading && !priceMissing && <Check className="w-7 h-7 mr-2" />} 
                {priceMissing ? 'Type the total first' : isLast ? 'Confirm & Save' : 'Next Entry'}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
