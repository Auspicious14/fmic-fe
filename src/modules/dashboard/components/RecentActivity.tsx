"use client";

import React from "react";
import { formatCurrency, cn } from "@/shared/lib/utils";
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const response = await apiClient.get("/transactions?limit=10");
      return response.data;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="px-4 space-y-3">
        <div className="h-5 w-36 bg-slate-100 rounded-lg animate-pulse mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-18 bg-white rounded-2xl animate-pulse border border-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3 pb-32">
      <h3 className="text-lg font-black text-slate-900 tracking-tight">
        Recent Activity
      </h3>
      {!transactions || transactions.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-medium text-sm">
            No activity today yet.
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Use the mic button to record a transaction
          </p>
        </div>
      ) : (
        transactions.map((item: any) => (
          <div
            key={item._id}
            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 shadow-sm"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className={cn(
                  "p-2.5 rounded-xl flex-shrink-0",
                  item.type === "credit"
                    ? "text-rose-500 bg-rose-50"
                    : item.type === "payment"
                      ? "text-emerald-500 bg-emerald-50"
                      : "text-blue-500 bg-blue-50",
                )}
              >
                {item.type === "credit" ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : item.type === "payment" ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <RefreshCcw className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">
                  {item.customer?.name || "Unknown Customer"}
                </p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "font-black text-base flex-shrink-0",
                item.type === "credit"
                  ? "text-rose-600"
                  : item.type === "payment"
                    ? "text-emerald-600"
                    : "text-blue-600",
              )}
            >
              {item.type === "credit" ? "-" : "+"}
              {formatCurrency(item.totalAmount)}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
