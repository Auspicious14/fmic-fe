"use client";

import React from 'react';
import { Card } from '@/shared/ui/Card';
import { formatCurrency, cn } from '@/shared/lib/utils';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Filter, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryPage() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      // Assuming a general history endpoint or using daily summary for now
      // Let's assume GET /transactions/all for full history
      const response = await apiClient.get('/transactions/daily-summary'); // Aggregated
      return []; 
    },
  });

  return (
    <div className="pt-8">
      <header className="px-6 mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">History</h1>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="px-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="px-6 space-y-4 pb-32">
          {transactions?.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm leading-relaxed">
                No history to show yet. <br /> Start speaking to add some!
              </p>
            </div>
          ) : (
            transactions?.map((t: any) => (
              <div key={t._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className={t.type === 'CREDIT' ? 'text-rose-500 bg-rose-50 p-3 rounded-xl' : 'text-emerald-500 bg-emerald-50 p-3 rounded-xl'}>
                    {t.type === 'CREDIT' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg leading-none">{t.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={t.type === 'CREDIT' ? 'font-black text-rose-600 text-lg leading-none' : 'font-black text-emerald-600 text-lg leading-none'}>
                    {t.type === 'CREDIT' ? '-' : '+'}{formatCurrency(t.totalAmount)}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{t.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
