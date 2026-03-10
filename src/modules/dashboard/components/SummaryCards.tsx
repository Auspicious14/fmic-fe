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
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
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
      return response.data;
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
      subLabel: `${summary?.breakdown?.find((b: any) => b._id === "credit")?.count || 0} transactions`,
      icon: TrendingUp,
      color: "text-rose-600",
      bg: "bg-rose-50",
      barColor: "bg-rose-400",
      barMax: maxVal,
      barValue: creditTotal,
      isCurrency: true,
    },
    {
      label: "Today's Payments",
      value: revenueTotal,
      subLabel: `${summary?.breakdown?.find((b: any) => b._id === "payment")?.count || 0} transactions`,
      icon: TrendingDown,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      barColor: "bg-emerald-400",
      barMax: maxVal,
      barValue: revenueTotal,
      isCurrency: true,
    },
    {
      label: "Active Customers",
      value: customerCount,
      subLabel: `${txCount} total transactions today`,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
      barColor: "bg-violet-400",
      barMax: Math.max(customerCount, 1),
      barValue: customerCount,
      isCurrency: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-white rounded-2xl animate-pulse border border-slate-100 shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4">
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-700">
              Could not load summary
            </p>
            <p className="text-xs text-rose-500 mt-0.5">
              Check your connection and try again
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 bg-rose-100 rounded-xl text-rose-600"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3">
      {/* Main stats */}
      {stats.map((item) => (
        <div
          key={item.label}
          className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-xl flex-shrink-0", item.bg)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {item.label}
                </p>
                <p className="text-2xl font-black text-slate-900 leading-tight mt-0.5">
                  {item.isCurrency ? formatCurrency(item.value) : item.value}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {item.subLabel}
                </p>
              </div>
            </div>
          </div>
          <MiniBar
            value={item.barValue}
            max={item.barMax}
            color={item.barColor}
          />
        </div>
      ))}

      {/* Net position indicator */}
      <div className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Net Position Today
          </p>
          <p
            className={cn(
              "text-2xl font-black mt-1 leading-none",
              revenueTotal >= creditTotal
                ? "text-emerald-400"
                : "text-rose-400",
            )}
          >
            {revenueTotal >= creditTotal ? "+" : ""}
            {formatCurrency(revenueTotal - creditTotal)}
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider",
            revenueTotal >= creditTotal
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-rose-500/20 text-rose-400",
          )}
        >
          <Activity className="w-3 h-3" />
          {revenueTotal >= creditTotal ? "Positive" : "Deficit"}
        </div>
      </div>

      {/* Today's date */}
      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-1">
        {summary?.date
          ? new Date(summary.date).toLocaleDateString("en-NG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Today"}
      </p>
    </div>
  );
}
