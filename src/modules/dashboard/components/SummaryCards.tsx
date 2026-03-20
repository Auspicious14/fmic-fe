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
    <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden mt-3">
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
      color: "text-[#EF4444]",
      bg: "bg-[#1A0A0A]",
      barColor: "bg-[#EF4444]",
      barMax: maxVal,
      barValue: creditTotal,
      isCurrency: true,
    },
    {
      label: "Today's Payments",
      value: revenueTotal,
      subLabel: `${summary?.breakdown?.find((b: any) => b._id === "payment")?.count || 0} transactions`,
      icon: TrendingDown,
      color: "text-[#22C55E]",
      bg: "bg-[#0A1A10]",
      barColor: "bg-[#22C55E]",
      barMax: maxVal,
      barValue: revenueTotal,
      isCurrency: true,
    },
    {
      label: "Active Customers",
      value: customerCount,
      subLabel: `${txCount} total transactions today`,
      icon: Users,
      color: "text-[#A855F7]",
      bg: "bg-[#120A1A]",
      barColor: "bg-[#A855F7]",
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
    <div className="space-y-3">
      {/* Main stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="bg-surface border border-border rounded-[20px] p-4 flex flex-col justify-between"
          >
            <div className="flex flex-col gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", item.bg)}>
                <item.icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[1px]">
                  {item.label}
                </p>
                <p className="text-xl font-black text-foreground leading-tight mt-1 font-syne">
                  {item.isCurrency ? formatCurrency(item.value) : item.value}
                </p>
              </div>
            </div>
            <MiniBar
              value={item.barValue}
              max={item.barMax}
              color={item.barColor}
            />
          </div>
        ))}

        {/* Net position as the 4th card in grid */}
        <div className="bg-surface border border-accent/20 rounded-[20px] p-4 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              revenueTotal >= creditTotal ? "bg-success/10" : "bg-danger/10"
            )}>
              <Activity className={cn("w-5 h-5", revenueTotal >= creditTotal ? "text-success" : "text-danger")} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted uppercase tracking-[1px]">
                Net Position
              </p>
              <p
                className={cn(
                  "text-xl font-black mt-1 leading-none font-syne",
                  revenueTotal >= creditTotal
                    ? "text-success"
                    : "text-danger",
                )}
              >
                {revenueTotal >= creditTotal ? "+" : ""}
                {formatCurrency(revenueTotal - creditTotal)}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "inline-flex items-center justify-center w-full py-1 rounded-full text-[8px] font-bold uppercase tracking-[1px] border mt-3",
              revenueTotal >= creditTotal
                ? "bg-success/5 text-success border-success/10"
                : "bg-danger/5 text-danger border-danger/10",
            )}
          >
            {revenueTotal >= creditTotal ? "Positive" : "Deficit"}
          </div>
        </div>
      </div>

      {/* Today's date */}
      <p className="text-center text-[10px] text-muted font-bold uppercase tracking-[1px] pt-2">
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
