"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/shared/lib/utils";
import { BottomNav } from "@/components/ui/BottomNav";
import {
  User,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Edit2,
  Trash2,
  Receipt,
  Share2,
  Loader2,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import html2canvas from "html2canvas";

import { Customer } from "./index";
import { useCustomers, useCustomerMutations } from "./hooks/useCustomers";
import { CustomerFormModal } from "./components/CustomerFormModal";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");

  const { data: customers, isLoading } = useCustomers();
  const { deleteMutation } = useCustomerMutations();

  const filteredCustomers = customers?.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.tag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setModalMode("add");
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode("edit");
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteMutation.mutate(id);
    }
  };

  const downloadReport = async () => {
    const element = document.getElementById("customers-list");
    if (!element) return;
    const canvas = await html2canvas(element);
    const link = document.createElement("a");
    link.download = `customers-report-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="p-6 pt-12 space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter font-syne uppercase italic">
              Customers
            </h1>
            <p className="text-muted font-bold text-xs uppercase tracking-widest mt-1">
              Manage your network
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="w-14 h-14 bg-accent text-background rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Stats */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              placeholder="Search by name, phone or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border-2 border-border rounded-[24px] py-5 pl-14 pr-6 text-foreground placeholder-muted font-bold text-sm focus:border-accent outline-none transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-5 bg-accent/5 border-accent/10">
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">Total Debtors</p>
              <p className="text-2xl font-black text-foreground font-syne">
                {customers?.filter(c => c.outstandingBalance > 0).length || 0}
              </p>
            </Card>
            <Card className="p-5 bg-elevated border-border">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Balance</p>
              <p className="text-2xl font-black text-foreground font-syne">
                {formatCurrency(customers?.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0) || 0)}
              </p>
            </Card>
          </div>
        </div>

        {/* List */}
        <div id="customers-list" className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
              Directory ({filteredCustomers?.length || 0})
            </h2>
            <button 
              onClick={downloadReport}
              className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Loading Customers...</p>
              </div>
            ) : filteredCustomers?.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-[32px] border-2 border-dashed border-border">
                <p className="text-muted font-bold text-sm">No customers found</p>
              </div>
            ) : (
              filteredCustomers?.map((customer) => (
                <motion.div
                  key={customer._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    onClick={() => setSelectedCustomer(customer)}
                    className={cn(
                      "p-5 hover:border-accent transition-all cursor-pointer group relative overflow-hidden",
                      selectedCustomer?._id === customer._id ? "border-accent ring-1 ring-accent/20" : ""
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black font-syne shrink-0 transition-colors",
                        customer.outstandingBalance > 0 ? "bg-danger/10 text-danger" : "bg-accent/10 text-accent"
                      )}>
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-foreground truncate">{customer.name}</h3>
                          {customer.tag && (
                            <span className="px-2 py-0.5 bg-elevated text-muted text-[8px] font-black uppercase tracking-widest rounded-md">
                              {customer.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted font-bold mt-0.5">{customer.phone || "No phone"}</p>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          "font-black font-syne",
                          customer.outstandingBalance > 0 ? "text-danger" : "text-success"
                        )}>
                          {formatCurrency(customer.outstandingBalance)}
                        </p>
                        <p className="text-[8px] font-black text-muted uppercase tracking-widest mt-1">
                          {customer.lastTransactionDate 
                            ? formatDistanceToNow(new Date(customer.lastTransactionDate), { addSuffix: true })
                            : "No activity"}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleEdit(customer, e)}
                          className="p-2.5 bg-elevated rounded-xl text-muted hover:text-accent transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(customer._id, e)}
                          className="p-2.5 bg-elevated rounded-xl text-muted hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-elevated rounded-xl text-muted text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors">
                          <Receipt className="w-3.5 h-3.5" /> Statement
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-background transition-all">
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <CustomerFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        customer={selectedCustomer}
        onClose={() => setIsModalOpen(false)}
      />

      <BottomNav />
    </div>
  );
}
