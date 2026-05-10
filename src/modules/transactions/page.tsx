"use client";

import React, { useState } from "react";
import { formatCurrency, cn } from "@/shared/lib/utils";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import apiClient from "@/shared/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Transaction } from "./index";
import { useTransactions } from "./hooks/useTransactions";
import { ReceiptModal } from "./components/ReceiptModal";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "credit" | "payment" | "adjustment"
  >("all");
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState("");
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  const {
    data: transactions,
    isLoading,
    refetch,
  } = useTransactions();

  const filtered = (transactions || []).filter((t: any) => {
    const matchType = filterType === "all" || t.type?.toLowerCase() === filterType;
    const matchSearch =
      !search ||
      t.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.type?.toLowerCase().includes(search.toLowerCase()) ||
      t._id?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleViewReceipt = async (tx: any) => {
    setSelectedTx(tx);
    setLoadingReceipt(true);
    setShowReceipt(true);
    try {
      const res = await apiClient.get(
        `/transactions/${tx._id}/receipt?format=html`,
        {
          responseType: "text",
        },
      );
      setReceiptHtml(
        typeof res.data === "string" ? res.data : (res.data as any).html || "",
      );
    } catch {
      toast.error("Could not load receipt");
      setShowReceipt(false);
    } finally {
      setLoadingReceipt(false);
    }
  };

  return (
    <div className="pt-8 min-h-screen bg-background pb-32">
      <header className="px-6 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground tracking-tight font-syne uppercase">
          History
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-3 bg-surface rounded-xl shadow-sm border border-border text-muted active:scale-95 transition-transform"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-accent/50 transition-colors">
          <Search className="w-5 h-5 text-muted flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
            className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-6 mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(["all", "credit", "payment", "adjustment"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
              filterType === type
                ? "bg-accent border-accent text-background shadow-lg"
                : "bg-surface border-border text-muted shadow-sm",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-surface border border-border rounded-2xl animate-pulse"
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-surface border border-dashed border-border rounded-3xl">
            <Search className="w-12 h-12 text-muted/20 mx-auto mb-4" />
            <p className="text-muted font-bold uppercase tracking-widest text-xs">
              No transactions found
            </p>
          </div>
        ) : (
          filtered.map((t: any) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleViewReceipt(t)}
              className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl active:scale-[0.98] transition-all cursor-pointer group hover:border-accent/50"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  t.type === "credit"
                    ? "bg-danger/10 text-danger"
                    : t.type === "payment"
                      ? "bg-success/10 text-success"
                      : "bg-accent/10 text-accent",
                )}
              >
                {t.type === "credit" ? (
                  <ArrowUpRight className="w-6 h-6" />
                ) : t.type === "payment" ? (
                  <ArrowDownLeft className="w-6 h-6" />
                ) : (
                  <RefreshCcw className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground truncate font-syne uppercase tracking-tight">
                  {t.customer?.name || "Unknown"}
                </p>
                <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-0.5">
                  {formatDistanceToNow(new Date(t.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-lg font-black font-syne",
                    t.type === "credit" ? "text-danger" : "text-success",
                  )}
                >
                  {t.type === "credit" ? "-" : "+"}
                  {formatCurrency(t.totalAmount)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <ReceiptModal 
        isOpen={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setReceiptHtml("");
        }}
        transaction={selectedTx}
        receiptHtml={receiptHtml}
        isLoading={loadingReceipt}
      />

      <BottomNav />
    </div>
  );
}
