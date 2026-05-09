"use client";

import React from "react";
import { formatCurrency, cn } from "@/shared/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  RefreshCcw,
  Activity,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";

interface SummaryBreakdownItem {
  _id: string;
  count: number;
}

interface DailySummary {
  totalCredit?: number;
  totalRevenue?: number;
  totalTransactions?: number;
  uniqueCustomers?: number;
  breakdown?: SummaryBreakdownItem[];
}

function MiniBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 bg-elevated rounded-full overflow-hidden mt-3">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SummaryCards() {
  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["daily-summary"],
    queryFn: async () => {
      const response = await apiClient.get("/transactions/daily-summary");
      return response.data as DailySummary;
    },
    refetchInterval: 60_000, // refresh every minute
  });

  const creditTotal = summary?.totalCredit ?? 0;
  const revenueTotal = summary?.totalRevenue ?? 0;
  const txCount = summary?.totalTransactions ?? 0;
  const customerCount = summary?.uniqueCustomers ?? 0;
  const maxVal = Math.max(creditTotal, revenueTotal, 1);

  const stats = [
    {
      label: "Today's Credit",
      value: creditTotal,
      subLabel: `${summary?.breakdown?.find((b) => b._id === "credit")?.count || 0} transactions`,
      icon: TrendingUp,
      color: "text-danger",
      bg: "bg-danger/10",
      barColor: "bg-danger",
      barMax: maxVal,
      barValue: creditTotal,
      isCurrency: true,
    },
    {
      label: "Today's Payments",
      value: revenueTotal,
      subLabel: `${summary?.breakdown?.find((b) => b._id === "payment")?.count || 0} transactions`,
      icon: TrendingDown,
      color: "text-success",
      bg: "bg-success/10",
      barColor: "bg-success",
      barMax: maxVal,
      barValue: revenueTotal,
      isCurrency: true,
    },
    {
      label: "Active Customers",
      value: customerCount,
      subLabel: `${txCount} total transactions today`,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
      barColor: "bg-accent",
      barMax: Math.max(customerCount, 1),
      barValue: customerCount,
      isCurrency: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[120px] fcim-skeleton"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger/10 border border-danger/20 rounded-[20px] p-5 flex items-center gap-4">
        <AlertCircle className="w-6 h-6 text-danger flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-bold text-danger">
            Could not load summary
          </p>
          <p className="text-xs text-danger/60 mt-0.5">
            Check your connection and try again
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 bg-danger/10 rounded-xl text-danger"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6">
      {/* Net position as a full-width featured card */}
      <div className={cn(
        "relative overflow-hidden rounded-[32px] p-6 shadow-lg border transition-all active:scale-[0.98]",
        revenueTotal >= creditTotal 
          ? "bg-surface border-success/20" 
          : "bg-surface border-danger/20"
      )}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] text-muted"
            )}>
              Consolidated Net Position
            </p>
            <p className={cn(
              "text-4xl font-black mt-2 font-syne leading-none tracking-tighter",
              revenueTotal >= creditTotal ? "text-success" : "text-danger"
            )}>
              {revenueTotal >= creditTotal ? "+" : ""}
              {formatCurrency(revenueTotal - creditTotal)}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <div className={cn(
                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                revenueTotal >= creditTotal 
                  ? "bg-success/20 text-success" 
                  : "bg-danger/10 text-danger"
              )}>
                {revenueTotal >= creditTotal ? "Surplus Position" : "Deficit Position"}
              </div>
              <p className={cn(
                "text-[10px] font-bold text-muted"
              )}>
                Live Ledger Balance
              </p>
            </div>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center",
            revenueTotal >= creditTotal ? "bg-success/10" : "bg-danger/10"
          )}>
            <Activity className={cn("w-6 h-6", revenueTotal >= creditTotal ? "text-success" : "text-danger")} />
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <Activity size={120} strokeWidth={1} />
        </div>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-3xl p-5 shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none">
              {stat.label}
            </p>
            <p className="text-xl font-black text-foreground mt-2 leading-none font-syne">
              {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
            </p>
            <p className="text-[10px] text-muted font-bold mt-1.5 leading-none">
              {stat.subLabel}
            </p>
            <MiniBar
              value={stat.barValue}
              max={stat.barMax}
              color={stat.barColor}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
