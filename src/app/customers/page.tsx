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
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
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
              </div>
            </div>

            <div className="p-8 border-t border-border flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-elevated text-foreground rounded-2xl font-bold text-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-4 bg-foreground text-background rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "add" ? "Create Customer" : "Save Changes"}
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
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl p-8 border border-border"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-foreground font-syne uppercase">
                Delete Customer?
              </h2>
              <p className="text-sm text-muted mt-2 leading-relaxed font-medium">
                This will permanently remove <strong>{customer.name}</strong> and all their transaction history.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-2">Reason for deletion</label>
                <textarea
                  placeholder="e.g. Duplicate account"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-border bg-elevated rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-danger/50 resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-elevated text-foreground rounded-2xl font-bold text-sm active:scale-95 transition-all"
                >
                  Keep
                </button>
                <button
                  onClick={() => onConfirm(reason)}
                  disabled={isLoading || !reason.trim()}
                  className="flex-1 py-4 bg-danger text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                </button>
              </div>
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
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [minDebt, setMinDebt] = useState<string>("");
  const [maxDebt, setMaxDebt] = useState<string>("");
  const [limit, setLimit] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

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
        backgroundColor: null,
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
        backgroundColor: null,
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

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { sortBy, sortOrder, minDebt, maxDebt, limit, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        limit: limit.toString(),
        search: searchQuery,
      });
      if (minDebt) params.append("minDebt", minDebt);
      if (maxDebt) params.append("maxDebt", maxDebt);
      
      const response = await apiClient.get(`/customers?${params.toString()}`);
      return response.data;
    },
  });

  const customers = data || [];

  const totalCount = data?.total || 0;

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
    <div className="pt-8 min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground leading-none tracking-tight font-syne">
          Customers
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-foreground text-background rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </header>

      {/* Search & Filter Trigger */}
      <div className="px-6 mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-3 bg-surface border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-accent/50 transition-colors">
            <Search className="w-5 h-5 text-muted flex-shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone…"
              className="flex-1 bg-transparent text-foreground placeholder-muted text-sm font-medium outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              showFilters ? "bg-accent border-accent text-background" : "bg-surface border-border text-muted"
            )}
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 bg-surface border border-border rounded-3xl space-y-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-accent"
                    >
                      <option value="name">Name</option>
                      <option value="outstandingBalance">Balance</option>
                      <option value="createdAt">Date Joined</option>
                      <option value="lastTransactionDate">Last Active</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Order</label>
                    <div className="flex bg-background border border-border rounded-xl p-1">
                      <button
                        onClick={() => setSortOrder("asc")}
                        className={cn("flex-1 py-1 text-[10px] font-black rounded-lg transition-all", sortOrder === "asc" ? "bg-accent text-background" : "text-muted")}
                      >ASC</button>
                      <button
                        onClick={() => setSortOrder("desc")}
                        className={cn("flex-1 py-1 text-[10px] font-black rounded-lg transition-all", sortOrder === "desc" ? "bg-accent text-background" : "text-muted")}
                      >DESC</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Min Balance (₦)</label>
                    <input
                      type="number"
                      value={minDebt}
                      onChange={(e) => setMinDebt(e.target.value)}
                      placeholder="0"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Max Balance (₦)</label>
                    <input
                      type="number"
                      value={maxDebt}
                      onChange={(e) => setMaxDebt(e.target.value)}
                      placeholder="Any"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Show</label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-[10px] font-black text-foreground outline-none"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setSortBy("name");
                      setSortOrder("asc");
                      setMinDebt("");
                      setMaxDebt("");
                      setLimit(50);
                    }}
                    className="text-[10px] font-black text-accent uppercase tracking-widest"
                  >Reset Filters</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Customer List */}
      <div className="px-6 space-y-4 pb-32">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-3xl animate-pulse" />
          ))
        ) : customers.length === 0 ? (
          <div className="py-20 text-center bg-surface border border-dashed border-border rounded-3xl">
            <User className="w-12 h-12 text-muted/20 mx-auto mb-4" />
            <p className="text-muted font-bold uppercase tracking-widest text-xs">No customers yet</p>
          </div>
        ) : (
          customers.map((c: Customer) => (
            <motion.div
              key={c._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedCustomer(c)}
              className={cn(
                "p-5 bg-surface border border-border rounded-3xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between group",
                selectedCustomer?._id === c._id && "border-accent ring-4 ring-accent/5 shadow-xl"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-elevated rounded-2xl flex items-center justify-center text-muted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-lg leading-none font-syne uppercase">
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-elevated text-muted text-[10px] font-black uppercase tracking-widest rounded-md">
                      {c.tag || "Standard"}
                    </span>
                    {c.lastTransactionDate && (
                      <span className="text-[10px] text-muted font-bold">
                        • {formatDistanceToNow(new Date(c.lastTransactionDate))} ago
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={cn(
                  "text-xl font-black font-syne",
                  c.outstandingBalance > 0 ? "text-danger" : "text-success"
                )}>
                  {formatCurrency(c.outstandingBalance)}
                </p>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                  Balance
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Transaction History Sheet */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-surface rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-foreground text-background rounded-2xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground leading-none font-syne uppercase">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">
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
                    className="p-2 bg-elevated rounded-xl text-muted hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2 bg-elevated rounded-xl text-muted hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 pb-10 bg-background">
                {/* Balance card */}
                <div className="bg-surface border border-border p-5 rounded-[28px] text-foreground flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      Outstanding Balance
                    </p>
                    <p className={cn(
                      "text-3xl font-black mt-1 leading-none font-syne",
                      selectedCustomer.outstandingBalance > 0 ? "text-danger" : "text-success"
                    )}>
                      {formatCurrency(selectedCustomer.outstandingBalance)}
                    </p>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
                    selectedCustomer.outstandingBalance > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                  )}>
                    {selectedCustomer.outstandingBalance > 0
                      ? "Owed"
                      : "Settled"}
                  </div>
                </div>

                {/* Customer info cards */}
                {(selectedCustomer.phone ||
                  selectedCustomer.email ||
                  selectedCustomer.address) && (
                  <div className="bg-surface rounded-2xl p-4 space-y-2 border border-border">
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted" />
                        <span className="text-foreground font-medium">
                          {selectedCustomer.phone}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-muted" />
                        <span className="text-foreground font-medium">
                          {selectedCustomer.email}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted" />
                        <span className="text-foreground font-medium">
                          {selectedCustomer.address}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Transactions */}
                <h3 className="text-xs font-black text-muted uppercase tracking-widest pt-2">
                  Transaction History
                </h3>

                {isHistoryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-surface rounded-2xl animate-pulse border border-border"
                      />
                    ))}
                  </div>
                ) : history?.length === 0 ? (
                  <div className="py-16 text-center bg-surface border border-dashed border-border rounded-3xl">
                    <Calendar className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                    <p className="text-muted font-bold uppercase tracking-widest text-xs">
                      No transactions yet
                    </p>
                  </div>
                ) : (
                  history?.map((t: any) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-3 rounded-xl",
                            t.type === "credit"
                              ? "bg-danger/10 text-danger"
                              : t.type === "payment"
                                ? "bg-success/10 text-success"
                                : "bg-accent/10 text-accent",
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
                          <p className="font-black text-foreground text-base leading-none capitalize font-syne">
                            {t.type}
                          </p>
                          <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">
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
                              "font-black text-lg leading-none font-syne",
                              t.type === "credit"
                                ? "text-danger"
                                : "text-success",
                            )}
                          >
                            {t.type === "credit" ? "-" : "+"}
                            {formatCurrency(t.totalAmount)}
                          </p>
                          <p className="text-[10px] text-muted uppercase font-black tracking-widest mt-1">
                            {t.items?.length > 0
                              ? `${t.items.length} Items`
                              : "Direct"}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleReceiptView(t)}
                            className="p-1.5 bg-elevated rounded-lg text-muted hover:text-foreground transition-colors"
                            title="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(t)}
                            className="p-1.5 bg-success/10 rounded-lg text-success hover:bg-success/20 transition-colors"
                            title="Share Receipt"
                          >
                            <Share2 className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-lg bg-surface rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-border"
            >
              <div className="flex items-center justify-between p-8 border-b border-border bg-surface">
                <div>
                  <h2 className="font-black text-foreground text-xl tracking-tight font-syne uppercase">
                    Receipt
                  </h2>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-0.5">
                    Official Record •{" "}
                    {selectedTxForReceipt?._id?.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReceiptForTx(null);
                    setSelectedTxForReceipt(null);
                  }}
                  className="p-2 bg-elevated text-muted rounded-full hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-background p-4">
                <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
                  <iframe
                    srcDoc={showReceiptForTx}
                    className="w-full min-h-[500px] border-none"
                    title="Receipt"
                  />
                </div>
              </div>

              <div className="p-6 bg-surface border-t border-border flex gap-3">
                <button
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-foreground text-background rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
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
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-success text-white rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-all"
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
