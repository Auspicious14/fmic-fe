"use client";

import React, { useState } from 'react';
import { Card } from '@/shared/ui/Card';
import { formatCurrency, cn } from '@/shared/lib/utils';
import { BottomNav } from '@/shared/ui/BottomNav';
import { User, Search, ChevronRight, X, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await apiClient.get('/customers');
      return response.data;
    },
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['customer-history', selectedCustomer?._id],
    queryFn: async () => {
      if (!selectedCustomer?._id) return [];
      const response = await apiClient.get(`/transactions/customer/${selectedCustomer._id}`);
      return response.data;
    },
    enabled: !!selectedCustomer?._id,
  });

  return (
    <div className="pt-8 min-h-screen bg-slate-50/50">
      <header className="px-6 mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Customers</h1>
        <button className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400">
          <Search className="w-5 h-5" />
        </button>
      </header>

      {isLoading ? (
        <div className="px-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-6 space-y-4 pb-32">
          {customers?.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No customers yet.</p>
              <button className="mt-4 text-slate-900 font-black underline decoration-2 underline-offset-4">Add your first</button>
            </div>
          ) : (
            customers?.map((c: any) => (
              <Card 
                key={c._id} 
                onClick={() => setSelectedCustomer(c)}
                className="flex items-center justify-between p-5 active:scale-[0.98] transition-all hover:border-slate-300 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg leading-none">{c.name}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                      {c.phone || 'No phone'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className={cn("font-black text-lg leading-none", c.outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600")}>
                      {formatCurrency(c.outstandingBalance)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                      {c.outstandingBalance > 0 ? 'Owed' : 'Balance'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Transaction History Modal/Sheet */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-none">{selectedCustomer.name}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1.5">Transaction History</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-12">
                <div className="bg-slate-900 p-6 rounded-[32px] text-white flex justify-between items-center mb-6 shadow-xl shadow-slate-200">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Balance</p>
                    <p className="text-3xl font-black mt-1 leading-none">
                      {formatCurrency(selectedCustomer.outstandingBalance)}
                    </p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    {selectedCustomer.outstandingBalance > 0 ? 'Owed' : 'Settled'}
                  </div>
                </div>

                {isHistoryLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse" />
                    ))}
                  </div>
                ) : history?.length === 0 ? (
                  <div className="py-20 text-center">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transactions found</p>
                  </div>
                ) : (
                  history?.map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl",
                          t.type === 'credit' ? "bg-rose-50 text-rose-500" : 
                          t.type === 'payment' ? "bg-emerald-50 text-emerald-500" : 
                          "bg-blue-50 text-blue-500"
                        )}>
                          {t.type === 'credit' ? <ArrowUpRight className="w-6 h-6" /> : 
                           t.type === 'payment' ? <ArrowDownLeft className="w-6 h-6" /> : 
                           <Calendar className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg leading-none capitalize">{t.type}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">
                            {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-black text-xl leading-none",
                          t.type === 'credit' ? "text-rose-600" : 
                          t.type === 'payment' ? "text-emerald-600" : 
                          "text-blue-600"
                        )}>
                          {t.type === 'credit' ? '-' : '+'}{formatCurrency(t.totalAmount)}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1.5">
                          {t.items?.length > 0 ? `${t.items.length} Items` : 'Cash'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
