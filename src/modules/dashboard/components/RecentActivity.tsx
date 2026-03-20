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
      <div className="space-y-3 px-6">
        <div className="h-5 w-36 bg-surface rounded-lg animate-pulse mb-4" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 fcim-skeleton !mx-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-32">
      <div className="px-6 mb-4">
        <h3 className="text-base font-bold text-foreground tracking-tight font-syne">
          Recent Activity
        </h3>
      </div>
      
      {!transactions || transactions.length === 0 ? (
        <div className="fcim-empty mx-6">
          <p className="fcim-empty-title text-muted">
            Ko si iṣowo loni
          </p>
          <p className="text-xs text-muted/60 mt-2 font-medium">
            No activity today yet. Use the mic to record.
          </p>
        </div>
      ) : (
        transactions.map((item: any) => (
          <div
            key={item._id}
            className="fcim-list-card"
          >
            <div
              className={cn(
                "fcim-list-icon",
                item.type === "credit"
                  ? "credit"
                  : item.type === "payment"
                    ? "payment"
                    : "adjust",
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
            
            <div className="fcim-list-info">
              <p className="fcim-list-name">
                {item.customer?.name || "Unknown Customer"}
              </p>
              <p className="fcim-list-meta">
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            <p
              className={cn(
                "fcim-list-amount",
                item.type === "credit"
                  ? "credit"
                  : item.type === "payment"
                    ? "payment"
                    : "adjust",
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
