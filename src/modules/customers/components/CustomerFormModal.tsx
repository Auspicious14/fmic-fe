"use client";

import React, { useState, useEffect } from "react";
import { X, User, Phone, Mail, MapPin, FileText, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { Customer, CustomerFormData, EMPTY_FORM } from "../index";
import { useCustomerMutations } from "../hooks/useCustomers";

interface CustomerFormModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  customer?: Customer | null;
  onClose: () => void;
}

function validateForm(data: CustomerFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name.trim()) errors.name = "Customer name is required";
  if (data.name.trim().length < 2)
    errors.name = "Name must be at least 2 characters";
  if (data.phone && !/^[+0-9\s\-()]{8,15}$/.test(data.phone)) {
    errors.phone = "Enter a valid phone number";
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address";
  }
  return errors;
}

export function CustomerFormModal({
  isOpen,
  mode,
  customer,
  onClose,
}: CustomerFormModalProps) {
  const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { createMutation, updateMutation, isLoading } = useCustomerMutations(onClose);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && customer) {
        setForm({
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          address: customer.address || "",
          tag: customer.tag || "",
          notes: customer.notes || "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, mode, customer]);

  const handleSubmit = () => {
    const allTouched = Object.fromEntries(
      Object.keys(form).map((k) => [k, true]),
    );
    setTouched(allTouched);
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (mode === "add") {
      createMutation.mutate(form);
    } else if (customer?._id) {
      updateMutation.mutate({ id: customer._id, data: form });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-500! flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="w-full max-w-lg bg-surface rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] border border-border"
          >
            <div className="p-8 pb-10 flex-shrink-0 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-foreground font-syne uppercase">
                    {mode === "add" ? "New Customer" : "Edit Customer"}
                  </h2>
                  <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">
                    Fill in the details below
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-elevated rounded-xl text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all",
                    errors.name && touched.name 
                      ? "border-danger bg-danger/5" 
                      : "border-border bg-elevated focus-within:border-accent focus-within:bg-surface"
                  )}>
                    <User className={cn(
                      "w-5 h-5 transition-colors",
                      errors.name && touched.name ? "text-danger" : "text-muted"
                    )} />
                    <input
                      placeholder="Enter customer name"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        setErrors({ ...errors, name: "" });
                      }}
                      onBlur={() => setTouched({ ...touched, name: true })}
                      className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none"
                    />
                  </div>
                  {errors.name && touched.name && (
                    <p className="text-[10px] text-danger font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Phone</label>
                    <div className="flex items-center gap-3 px-4 py-4 bg-elevated border border-border rounded-2xl focus-within:border-accent transition-colors">
                      <Phone className="w-4 h-4 text-muted" />
                      <input
                        type="tel"
                        placeholder="080..."
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Tag / Label</label>
                    <div className="flex items-center gap-3 px-4 py-4 bg-elevated border border-border rounded-2xl focus-within:border-accent transition-colors">
                      <Plus className="w-4 h-4 text-muted" />
                      <input
                        placeholder="e.g. Regular"
                        value={form.tag}
                        onChange={(e) => setForm({ ...form, tag: e.target.value })}
                        className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-4 bg-elevated border border-border rounded-2xl focus-within:border-accent transition-colors">
                    <Mail className="w-4 h-4 text-muted" />
                    <input
                      type="email"
                      placeholder="customer@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Shop Address</label>
                  <div className="flex items-start gap-3 px-4 py-4 bg-elevated border border-border rounded-2xl focus-within:border-accent transition-colors">
                    <MapPin className="w-4 h-4 text-muted mt-0.5" />
                    <textarea
                      placeholder="Enter physical location"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none resize-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Private Notes</label>
                  <div className="flex items-start gap-3 px-4 py-4 bg-elevated border border-border rounded-2xl focus-within:border-accent transition-colors">
                    <FileText className="w-4 h-4 text-muted mt-0.5" />
                    <textarea
                      placeholder="Add any additional context..."
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={3}
                      className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-elevated flex gap-4 border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 py-4 px-6 rounded-2xl font-bold uppercase tracking-widest text-muted hover:bg-border transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-[2] py-4 px-6 rounded-2xl font-bold uppercase tracking-widest bg-accent text-background hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  mode === "add" ? "Create Customer" : "Save Changes"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
