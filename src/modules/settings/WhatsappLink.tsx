"use client";

import React, { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/shared/lib/api-client";

/** The Ledga bot's WhatsApp number, digits only (e.g. 2348012345678). */
const BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER;

function displayPhone(digits?: string) {
  if (!digits) return "";
  return digits.startsWith("234") ? `0${digits.slice(3)}` : `+${digits}`;
}

/**
 * Lets the shop owner link the WhatsApp number they'll voice-note Ledga from.
 */
export function WhatsappLink({
  linkedPhone,
  onLinked,
}: {
  linkedPhone?: string;
  onLinked: (phone?: string) => void;
}) {
  const [phone, setPhone] = useState(displayPhone(linkedPhone));
  const [isSaving, setIsSaving] = useState(false);

  const save = async (value: string | null) => {
    setIsSaving(true);
    try {
      const response = await apiClient.patch("/auth/whatsapp", { phone: value });
      onLinked(response.data?.whatsappPhone);
      setPhone(displayPhone(response.data?.whatsappPhone));
      toast.success(value ? "WhatsApp number linked" : "WhatsApp number removed");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not save the number. Check it and try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 bg-surface rounded-2xl border border-border shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-elevated rounded-xl text-muted">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg leading-none">WhatsApp</p>
          <p className="text-sm text-muted font-medium mt-1.5">
            {linkedPhone
              ? `Linked: ${displayPhone(linkedPhone)}`
              : "Record sales by sending Ledga a voice note"}
          </p>
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save(phone.trim() || null);
        }}
      >
        <label htmlFor="whatsapp-phone" className="sr-only">
          Your WhatsApp number
        </label>
        <input
          id="whatsapp-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08031234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-input-bg border border-input-border text-foreground font-medium"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-3 rounded-xl bg-accent text-black font-bold disabled:opacity-60"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : linkedPhone ? "Update" : "Link"}
        </button>
      </form>

      {linkedPhone && BOT_NUMBER && (
        <a
          href={`https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent("Hi Ledga")}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center px-4 py-3 rounded-xl bg-success/15 text-success font-bold"
        >
          Open the Ledga chat on WhatsApp
        </a>
      )}

      {linkedPhone && (
        <button
          type="button"
          onClick={() => void save(null)}
          disabled={isSaving}
          className="text-sm text-muted font-semibold underline underline-offset-4"
        >
          Unlink this number
        </button>
      )}
    </div>
  );
}
