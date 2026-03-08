"use client";

import React from 'react';
import { formatCurrency } from '@/shared/lib/utils';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/lib/api-client';
import { formatDistanceToNow } from 'date-fns';

export function RecentActivity() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      // For dashboard, we might want a general list or summary
      // Using a customer-specific one for now as placeholder or update backend to provide global list
      const response = await apiClient.get('/transactions/daily-summary'); // This is aggregated
      // Let's assume we have a global list endpoint or use first customer's history for demo
      // In real app, we'd have GET /transactions/recent
      return []; 
    },
  });

  // Mocking recent activity from a real list if we had one
  // For now, let's update this to be empty or static until we add the global history endpoint
  if (isLoading) return <div className="px-4 h-32 bg-white rounded-2xl animate-pulse" />;

  return (
    <div className="px-4 space-y-3 pb-32">
      <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Recent Activity</h3>
      {transactions?.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium">No activity today yet.</p>
        </div>
      ) : (
        transactions?.map((item: any) => (
          <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={item.type === 'CREDIT' ? 'text-rose-500 bg-rose-50 p-2 rounded-lg' : 'text-emerald-500 bg-emerald-50 p-2 rounded-lg'}>
                {item.type === 'CREDIT' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-slate-900">{item.customerName}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <p className={item.type === 'CREDIT' ? 'font-black text-rose-600' : 'font-black text-emerald-600'}>
              {item.type === 'CREDIT' ? '-' : '+'}{formatCurrency(item.totalAmount)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
