"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/shared/ui/Card";
import { formatCurrency, cn } from "@/shared/lib/utils";
import { BottomNav } from "@/shared/ui/BottomNav";
import {
  User,
  Search,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  Receipt,
  Share2,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

type Customer = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tag?: string;
  notes?: string;
  outstandingBalance: number;
  lastTransactionDate?: string;
};

type CustomerFormData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  tag: string;
  notes: string;
};

const EMPTY_FORM: CustomerFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  tag: "",
  notes: "",
};

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

function CustomerFormModal({
  isOpen,
  mode,
  customer,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  mode: "add" | "edit";
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<CustomerFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiClient.post("/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully!");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      apiClient.patch(`/customers/${customer?._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully!");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update customer");
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const handleChange = (field: keyof CustomerFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const newErrors = validateForm({ ...form, [field]: value });
      setErrors(newErrors);
    }
  };

  const handleBlur = (field: keyof CustomerFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validateForm(form);
    setErrors(newErrors);
  };

  const handleSubmit = () => {
    const allTouched = Object.fromEntries(
      Object.keys(form).map((k) => [k, true]),
    );
    setTouched(allTouched);
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      ...form,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      tag: form.tag || undefined,
      notes: form.notes || undefined,
    };

    if (mode === "add") {
      createMutation.mutate(payload as any);
    } else {
      updateMutation.mutate(payload as any);
    }
  };

  const fields: Array<{
    key: keyof CustomerFormData;
    label: string;
    placeholder: string;
    required?: boolean;
    icon: React.ReactNode;
    type?: string;
  }> = [
    {
      key: "name",
      label: "Full Name",
      placeholder: "Babatunde Adekunle",
      required: true,
      icon: <User className="w-4 h-4" />,
    },
    {
      key: "phone",
      label: "Phone Number",
      placeholder: "+2348012345678",
      icon: <Phone className="w-4 h-4" />,
      type: "tel",
    },
    {
      key: "email",
      label: "Email Address",
      placeholder: "babatunde@email.com",
      icon: <Mail className="w-4 h-4" />,
      type: "email",
    },
    {
      key: "address",
      label: "Billing Address",
      placeholder: "12 Bode Thomas Street, Lagos",
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      key: "tag",
      label: "Tag / Category",
      placeholder: "mechanic, tailor, farmer…",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      key: "notes",
      label: "Notes",
      placeholder: "Any special notes about this customer…",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {mode === "add" ? "Add New Customer" : "Edit Customer"}
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {mode === "add"
                    ? "Fill in the details below to add a new customer"
                    : "Update the customer information"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    {field.label}{" "}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div
                    className={cn(
                      "flex items-center gap-3 border rounded-xl px-4 py-3 transition-all",
                      errors[field.key] && touched[field.key]
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-100 bg-slate-50 focus-within:border-slate-400 focus-within:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0",
                        errors[field.key] && touched[field.key]
                          ? "text-rose-400"
                          : "text-slate-400",
                      )}
                    >
                      {field.icon}
                    </span>
                    <input
                      type={field.type || "text"}
                      value={form[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      onBlur={() => handleBlur(field.key)}
                      placeholder={field.placeholder}
                      className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium outline-none"
                    />
                  </div>
                  {errors[field.key] && touched[field.key] && (
                    <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errors[field.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isLoading
                  ? "Saving…"
                  : mode === "add"
                    ? "Add Customer"
                    : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DeleteConfirmModal({
  isOpen,
  customer,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && customer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-rose-50 rounded-2xl mb-4">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Delete Customer?
              </h2>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                <strong>{customer.name}</strong> will be soft-deleted. Their
                transaction history will be preserved for audit purposes.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Reason (optional)
              </label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Customer moved away, duplicate entry…"
                className="w-full border border-slate-100 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(reason)}
                disabled={isLoading}
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function CustomersPage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showReceiptForTx, setShowReceiptForTx] = useState<any>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

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
      link.download = `receipt-${selectedTxForReceipt?._id?.substring(0, 8)}.png`;
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
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Failed to create blob");

      const file = new File(
        [blob],
        `receipt-${selectedTxForReceipt?._id?.substring(0, 8)}.png`,
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
        toast.info("Sharing files not supported. Image downloaded instead.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share receipt image");
    }
  };

  const handleShareWhatsApp = async (tx: any) => {
    // 1. If modal is open, use the existing content
    if (
      showReceiptForTx &&
      receiptRef.current &&
      selectedTxForReceipt?._id === tx._id
    ) {
      await handleShareImage();
      return;
    }

    // 2. If modal is closed, we need to fetch and render hidden
    toast.promise(
      async () => {
        setSelectedTxForReceipt(tx);
        const res = await apiClient.get(
          `/transactions/${tx._id}/receipt?format=html`,
          { responseType: "text" },
        );
        const html =
          typeof res.data === "string" ? res.data : (res.data as any).html;
        setShowReceiptForTx(html);

        // Wait for React to render the hidden div
        await new Promise((r) => setTimeout(r, 500));

        await handleShareImage();
      },
      {
        loading: "Generating receipt image...",
        success: "Receipt shared!",
        error: "Failed to generate image",
      },
    );
  };

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await apiClient.get("/customers");
      return response.data;
    },
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["customer-history", selectedCustomer?._id],
    queryFn: async () => {
      if (!selectedCustomer?._id) return [];
      const response = await apiClient.get(
        `/transactions/customer/${selectedCustomer._id}`,
      );
      return response.data;
    },
    enabled: !!selectedCustomer?._id,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      apiClient.delete(`/customers/${id}`, { data: { reason } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
      setDeleteCustomer(null);
      if (selectedCustomer?._id === deleteCustomer?._id) {
        setSelectedCustomer(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    },
  });

  const filteredCustomers = (customers || []).filter(
    (c: Customer) =>
      !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.tag?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleReceiptView = async (tx: any) => {
    setSelectedTxForReceipt(tx);
    try {
      const res = await apiClient.get(
        `/transactions/${tx._id}/receipt?format=html`,
        { responseType: "text" },
      );
      setShowReceiptForTx(
        typeof res.data === "string" ? res.data : (res.data as any).html,
      );
    } catch {
      toast.error("Could not load receipt");
    }
  };

  return (
    <div className="pt-8 min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="px-6 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
          Customers
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </header>

      {/* Search */}
      <div className="px-6 mb-5">
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <Search className="w-5 h-5 text-slate-300 flex-shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone…"
            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium outline-none"
          />
        </div>
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="px-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100"
            />
          ))}
        </div>
      ) : (
        <div className="px-6 space-y-3 pb-32">
          {filteredCustomers.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                {searchQuery ? "No customers found" : "No customers yet."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-slate-900 font-black underline decoration-2 underline-offset-4"
                >
                  Add your first customer
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map((c: Customer) => (
              <Card
                key={c._id}
                className="flex items-center justify-between p-4 active:scale-[0.98] transition-all hover:border-slate-300 cursor-pointer"
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0"
                  onClick={() => setSelectedCustomer(c)}
                >
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-400 flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-base leading-none truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {c.phone || c.email || c.tag || "No contact"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-2">
                  <div
                    className="text-right cursor-pointer"
                    onClick={() => setSelectedCustomer(c)}
                  >
                    <p
                      className={cn(
                        "font-black text-base leading-none",
                        c.outstandingBalance > 0
                          ? "text-rose-600"
                          : "text-emerald-600",
                      )}
                    >
                      {formatCurrency(c.outstandingBalance)}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                      {c.outstandingBalance > 0 ? "Owed" : "Balance"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditCustomer(c);
                      }}
                      className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Edit customer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCustomer(c);
                      }}
                      className="p-2 bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                      title="Delete customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Transaction History Sheet */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-none">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {selectedCustomer.phone ||
                        selectedCustomer.email ||
                        selectedCustomer.tag ||
                        "Customer"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditCustomer(selectedCustomer);
                      setSelectedCustomer(null);
                    }}
                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-10">
                {/* Balance card */}
                <div className="bg-slate-900 p-5 rounded-[28px] text-white flex justify-between items-center shadow-xl">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Current Balance
                    </p>
                    <p className="text-3xl font-black mt-1 leading-none">
                      {formatCurrency(selectedCustomer.outstandingBalance)}
                    </p>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    {selectedCustomer.outstandingBalance > 0
                      ? "Owed"
                      : "Settled"}
                  </div>
                </div>

                {/* Customer info cards */}
                {(selectedCustomer.phone ||
                  selectedCustomer.email ||
                  selectedCustomer.address) && (
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 font-medium">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 font-medium">
                          {selectedCustomer.email}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700 font-medium">
                          {selectedCustomer.address}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Transactions */}
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pt-2">
                  Transaction History
                </h3>

                {isHistoryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-slate-50 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : history?.length === 0 ? (
                  <div className="py-16 text-center">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No transactions yet
                    </p>
                  </div>
                ) : (
                  history?.map((t: any) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-3 rounded-xl",
                            t.type === "credit"
                              ? "bg-rose-50 text-rose-500"
                              : t.type === "payment"
                                ? "bg-emerald-50 text-emerald-500"
                                : "bg-blue-50 text-blue-500",
                          )}
                        >
                          {t.type === "credit" ? (
                            <ArrowUpRight className="w-5 h-5" />
                          ) : t.type === "payment" ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <Calendar className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-base leading-none capitalize">
                            {t.type}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            {formatDistanceToNow(new Date(t.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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
                            onClick={() => handleReceiptView(t)}
                            className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(t)}
                            className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500 hover:text-emerald-700 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Viewer */}
      <AnimatePresence>
        {showReceiptForTx && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-white">
                <div>
                  <h2 className="font-black text-slate-900 text-xl tracking-tight">
                    Receipt
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                    Official Record •{" "}
                    {selectedTxForReceipt?._id?.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReceiptForTx(null);
                    setSelectedTxForReceipt(null);
                  }}
                  className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <iframe
                    srcDoc={showReceiptForTx}
                    className="w-full min-h-[500px] border-none"
                    title="Receipt"
                  />
                </div>
              </div>

              <div className="p-6 bg-white border-t border-slate-50 flex gap-3">
                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Download PNG
                </button>
                <button
                  onClick={() => handleShareWhatsApp(selectedTxForReceipt)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-emerald-600 transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share Image
                </button>
              </div>

              {/* Hidden div for image capture */}
              <div className="fixed -left-[9999px] top-0">
                <div
                  ref={receiptRef}
                  dangerouslySetInnerHTML={{ __html: showReceiptForTx }}
                  style={{ width: "400px", backgroundColor: "white" }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <CustomerFormModal
        isOpen={showAddModal || !!editCustomer}
        mode={editCustomer ? "edit" : "add"}
        customer={editCustomer}
        onClose={() => {
          setShowAddModal(false);
          setEditCustomer(null);
        }}
        onSuccess={() => {
          setShowAddModal(false);
          setEditCustomer(null);
        }}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteCustomer}
        customer={deleteCustomer}
        onClose={() => setDeleteCustomer(null)}
        onConfirm={(reason) =>
          deleteCustomer &&
          deleteMutation.mutate({ id: deleteCustomer._id, reason })
        }
        isLoading={deleteMutation.isPending}
      />

      <BottomNav />
    </div>
  );
}
