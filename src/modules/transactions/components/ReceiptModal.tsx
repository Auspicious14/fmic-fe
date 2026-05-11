"use client";

import React from "react";
import { X, Loader2, Share2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Transaction } from "../index";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | any;
  receiptHtml: string;
  isLoading: boolean;
}

export function ReceiptModal({
  isOpen,
  onClose,
  transaction,
  receiptHtml,
  isLoading,
}: ReceiptModalProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `receipt-${transaction?.id?.substring(0, 8)}.png`;
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

  const handleShareImage = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Failed to create blob");

      const file = new File(
        [blob],
        `receipt-${transaction?.id?.substring(0, 8)}.png`,
        { type: "image/png" },
      );

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Transaction Receipt",
          text: "Here is your transaction receipt from FMIC.",
        });
      } else {
        handleDownloadImage();
        toast.info(
          "Sharing files not supported on this browser. Image downloaded instead.",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share receipt image");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && receiptHtml && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-500! flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="w-full max-w-lg rounded-t-[20px] sm:rounded-[20px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-border"
          >
            <div className="flex items-center justify-between border-b border-border bg-surface px-4! py-2!">
              <div>
                <h2 className="font-black text-foreground text-xl tracking-tight font-syne uppercase">
                  Receipt
                </h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-0.5">
                  Official Record •{" "}
                  {transaction?._id?.substring(0, 8).toUpperCase() || transaction?.id?.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-elevated text-muted rounded-full hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-background p-4">
              <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden relative">
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-[500px]">
                    <Loader2 className="w-8 h-8 animate-spin text-muted" />
                  </div>
                ) : (
                  <>
                    <iframe
                      srcDoc={receiptHtml}
                      className="w-full min-h-[500px] border-none"
                      title="Receipt"
                    />
                    {/* Hidden div for html2canvas to capture */}
                    <div 
                      ref={receiptRef}
                      dangerouslySetInnerHTML={{ __html: receiptHtml }}
                      className="absolute top-0 left-0 w-full opacity-0 pointer-events-none"
                      style={{ width: '400px' }} // Fixed width for better capture
                    />
                  </>
                )}
              </div>
            </div>

            <div className="px-4! py-2! bg-surface border-t border-border flex gap-3">
              <button
                onClick={handleDownloadImage}
                disabled={isDownloading || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6! py-4! bg-foreground text-background rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button
                onClick={handleShareImage}
                disabled={isDownloading || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6! py-4! bg-accent text-background rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
