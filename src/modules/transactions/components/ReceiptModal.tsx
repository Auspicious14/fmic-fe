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
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // MongoDB returns `_id`, not `id` — reading only `id` gave "receipt-undefined.png".
  const transactionId: string = transaction?._id ?? transaction?.id ?? "";
  const shortRef = transactionId.substring(0, 8).toUpperCase();
  const fileName = `receipt-${shortRef || Date.now()}.png`;

  // Grow the iframe to the receipt's full height so nothing is cut off
  // (on screen or in the downloaded image).
  const fitIframeToContent = () => {
    const doc = iframeRef.current?.contentDocument;
    if (iframeRef.current && doc?.documentElement) {
      iframeRef.current.style.height = `${doc.documentElement.scrollHeight}px`;
    }
  };

  /**
   * Draw the receipt from the visible iframe. The old code drew a hidden copy
   * with opacity: 0, and html2canvas faithfully drew it... invisible, so the
   * image came out blank. The copy also leaked the receipt's global CSS
   * (`* { margin: 0 }`, `body { ... }`) into the rest of the app.
   */
  const renderReceiptCanvas = async (): Promise<HTMLCanvasElement> => {
    const doc = iframeRef.current?.contentDocument;
    const target = doc?.querySelector<HTMLElement>(".receipt") ?? doc?.body;
    if (!doc || !target) throw new Error("Receipt is not ready yet");

    // Wait for the Inter web font, otherwise text can render in a fallback font.
    await doc.fonts?.ready;

    return html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: doc.documentElement.scrollWidth,
      windowHeight: doc.documentElement.scrollHeight,
    });
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    try {
      const canvas = await renderReceiptCanvas();
      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Receipt image downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate receipt image");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareImage = async () => {
    setIsDownloading(true);
    try {
      const canvas = await renderReceiptCanvas();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Failed to create blob");

      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Transaction Receipt",
          text: "Here is your receipt from Ledga.",
        });
      } else {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        toast.info(
          "Sharing files not supported on this browser. Image downloaded instead.",
        );
      }
    } catch (err) {
      // User closing the share sheet is not an error.
      if ((err as Error)?.name !== "AbortError") {
        console.error(err);
        toast.error("Failed to share receipt image");
      }
    } finally {
      setIsDownloading(false);
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
                  {shortRef}
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
                      ref={iframeRef}
                      srcDoc={receiptHtml}
                      onLoad={fitIframeToContent}
                      className="w-full min-h-[500px] border-none"
                      title="Receipt"
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
