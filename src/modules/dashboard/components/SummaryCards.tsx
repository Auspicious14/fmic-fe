"use client";

import React from 'react';
import { Card } from '@/shared/ui/Card';
import { formatCurrency, cn } from '@/shared/lib/utils';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/lib/api-client';

export function SummaryCards() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: async () => {
      const response = await apiClient.get('/transactions/daily-summary');
      return response.data;
    },
  });

  const stats = [
    { 
      label: "Today's Credit", 
      value: summary?.find((s: any) => s._id === 'CREDIT')?.total || 0, 
      icon: TrendingUp, 
      color: "text-rose-600",
      bg: "bg-rose-50" 
    },
    { 
      label: "Today's Payments", 
      value: summary?.find((s: any) => s._id === 'PAYMENT')?.total || 0, 
      icon: TrendingDown, 
      color: "text-emerald-600",
      bg: "bg-emerald-50" 
    },
    { 
      label: "Debtors Today", 
      value: summary?.find((s: any) => s._id === 'CREDIT')?.count || 0, 
      icon: Users, 
      color: "text-blue-600",
      bg: "bg-blue-50",
      isCount: true
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4">
      {stats.map((item) => (
        <Card key={item.label} className="flex items-center gap-4 py-4">
          <div className={cn("p-3 rounded-xl", item.bg)}>
            <item.icon className={cn("w-6 h-6", item.color)} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">
              {item.isCount ? item.value : formatCurrency(item.value)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
