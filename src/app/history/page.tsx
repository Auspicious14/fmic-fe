"use client";

import React, { useState } from "react";
import { formatCurrency, cn } from "@/shared/lib/utils";
import { BottomNav } from "@/shared/ui/BottomNav";
import {
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Receipt,
  Share2,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import html2canvas from "html2canvas";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "credit" | "payment" | "adjustment"
  >("all");
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState("");
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const receiptRef = React.useRef<HTMLDivElement>(null);

  const {
    data: transactions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["transactions-history"],
    queryFn: async () => {
      const response = await apiClient.get("/transactions?limit=100");
      return response.data;
    },
  });

  const filtered = (transactions || []).filter((t: any) => {
    const matchType = filterType === "all" || t.type === filterType;
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
    try {
      const res = await apiClient.get(
        `/transactions/${tx._id}/receipt?format=html`,
        {
          responseType: "text",
        },
      );
      setReceiptHtml(
        typeof res.data === "string" ? res.data : res.data.html || "",
      );
      setShowReceipt(true);
    } catch {
      toast.error("Could not load receipt");
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleShareWhatsApp = async (tx: any) => {
    try {
      const res = await apiClient.get(`/transactions/${tx._id}/whatsapp`);
      const { whatsappUrl, message } = res.data;
      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank");
      } else {
        // No phone number — copy message to clipboard
        await navigator.clipboard.writeText(message);
        toast.success("Receipt copied to clipboard! (No phone number on file)");
      }
    } catch {
      toast.error("Could not generate WhatsApp link");
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High resolution
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `receipt-${selectedTx?._id?.substring(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Receipt image downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate receipt image");
    } finally {
      setIsDownloading(false);
    }
  };

  const typeColors: Record<string, string> = {
    credit: "text-rose-500 bg-rose-50",
    payment: "text-emerald-500 bg-emerald-50",
    adjustment: "text-blue-500 bg-blue-50",
  };

  return (
    <div className="pt-8 min-h-screen bg-slate-50/50">
      <header className="px-6 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
          History
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 active:scale-95 transition-transform"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <Search className="w-5 h-5 text-slate-300 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, type, or ID…"
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium outline-none"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-6 mb-5 flex gap-2 overflow-x-auto pb-1">
        {(["all", "credit", "payment", "adjustment"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all",
              filterType === type
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white text-slate-400 border border-slate-100 shadow-sm",
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="px-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="px-6 space-y-3 pb-32">
          {filtered.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm leading-relaxed">
                No transactions found
              </p>
            </div>
          ) : (
            filtered.map((t: any) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      "p-3 rounded-xl flex-shrink-0",
                      typeColors[t.type] || "bg-slate-50 text-slate-500",
                    )}
                  >
                    {t.type === "credit" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : t.type === "payment" ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <RefreshCcw className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 text-base leading-none truncate">
                      {t.customer?.name || "Unknown Customer"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5">
                      {formatDistanceToNow(new Date(t.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-black text-lg leading-none",
                        t.type === "credit"
                          ? "text-rose-600"
                          : t.type === "payment"
                            ? "text-emerald-600"
                            : "text-blue-600",
                      )}
                    >
                      {t.type === "credit" ? "-" : "+"}
                      {formatCurrency(t.totalAmount)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                      {t.items?.length > 0
                        ? `${t.items.length} Items`
                        : "Direct"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleViewReceipt(t)}
                      disabled={loadingReceipt}
                      className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="View Receipt"
                    >
                      {loadingReceipt && selectedTx?._id === t._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Receipt className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleShareWhatsApp(t)}
                      className="p-2 bg-emerald-50 rounded-xl text-emerald-500 hover:bg-emerald-100 transition-colors"
                      title="Share via WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {showReceipt && receiptHtml && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="font-black text-slate-900 text-lg">
                  Transaction Receipt
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadImage}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Image
                  </button>
                  <button
                    onClick={() =>
                      selectedTx && handleShareWhatsApp(selectedTx)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      setShowReceipt(false);
                      setReceiptHtml("");
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <iframe
                  srcDoc={receiptHtml}
                  className="w-full h-full min-h-[500px] border-none"
                  title="Transaction Receipt"
                />
              </div>
              {/* Hidden div for image capture */}
              <div className="fixed -left-[9999px] top-0">
                <div
                  ref={receiptRef}
                  dangerouslySetInnerHTML={{ __html: receiptHtml }}
                  style={{ width: "400px", backgroundColor: "white" }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
