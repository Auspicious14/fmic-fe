"use client";

import React, { useState } from "react";
import { BottomNav } from "@/shared/ui/BottomNav";
import { formatCurrency, cn } from "@/shared/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCcw,
  Download,
  Shield,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  PieChart as PieIcon,
  BarChart as BarIcon,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-900 mt-1 leading-tight">
        {value}
      </p>
      {subLabel && <p className="text-xs text-slate-400 mt-1">{subLabel}</p>}
    </div>
  );
}

export default function SummaryPage() {
  const [verifying, setVerifying] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const {
    data: summary,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["daily-summary-page"],
    queryFn: async () => {
      const response = await apiClient.get("/transactions/daily-summary");
      return response.data;
    },
    refetchInterval: 60_000,
  });

  const { data: trends, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["weekly-trends"],
    queryFn: async () => {
      const response = await apiClient.get("/transactions/weekly-trends");
      return response.data;
    },
  });

  const { data: recentTxs, isLoading: isRecentLoading } = useQuery({
    queryKey: ["recent-for-summary"],
    queryFn: async () => {
      const response = await apiClient.get("/transactions?limit=20");
      return response.data;
    },
  });

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await apiClient.get("/transactions/verify-all");
      setAuditResult(res.data);
      if (res.data.flagged === 0) {
        toast.success(`All ${res.data.total} transactions verified ✓`);
      } else {
        toast.error(`${res.data.flagged} transactions flagged for review!`);
      }
    } catch {
      toast.error("Could not run verification");
    } finally {
      setVerifying(false);
    }
  };

  const handleExportCSV = () => {
    if (!recentTxs?.length) {
      toast.error("No transactions to export");
      return;
    }
    const headers = ["ID", "Customer", "Type", "Amount", "Items", "Date"];
    const rows = recentTxs.map((t: any) => [
      t._id,
      t.customer?.name || "Unknown",
      t.type,
      t.totalAmount,
      t.items?.length || 0,
      new Date(t.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fmic-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV Report exported!");
  };

  const breakdown = summary?.breakdown || [];
  const creditTotal = summary?.totalCredit || 0;
  const revenueTotal = summary?.totalRevenue || 0;
  const netPosition = revenueTotal - creditTotal;

  const pieData = breakdown
    .filter((d: any) => d.total > 0)
    .map((d: any) => ({
      name: d._id.toUpperCase(),
      value: d.total,
    }));

  const COLORS = ["#ef4444", "#10b981", "#3b82f6"];

  return (
    <div className="pt-8 min-h-screen bg-slate-50/50">
      <header className="px-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
            Business Intelligence
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Live Insights • {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 active:scale-95 transition-transform"
          >
            {isFetching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCcw className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="p-3 bg-slate-900 rounded-xl shadow-lg text-white active:scale-95 transition-transform"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="px-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-white rounded-3xl animate-pulse" />
        </div>
      ) : (
        <div className="px-6 space-y-5 pb-32">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Today's Outflow (Credit)"
              value={formatCurrency(creditTotal)}
              subLabel="Money owed to you"
              icon={TrendingUp}
              color="text-rose-600"
              bg="bg-rose-50"
            />
            <StatCard
              label="Today's Inflow (Payments)"
              value={formatCurrency(revenueTotal)}
              subLabel="Cash collected"
              icon={TrendingDown}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              label="Customer Reach"
              value={summary?.uniqueCustomers || 0}
              subLabel="Active buyers today"
              icon={Users}
              color="text-violet-600"
              bg="bg-violet-50"
            />
            <StatCard
              label="Ops Volume"
              value={summary?.totalTransactions || 0}
              subLabel="Total events logged"
              icon={Activity}
              color="text-blue-600"
              bg="bg-blue-50"
            />
          </div>

          {/* Performance Trend Chart */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  7-Day Transaction Flow
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Payment vs Credit Trends
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Payments
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[10px] font-bold text-slate-500">
                    Credit
                  </span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {isTrendsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
                </div>
              ) : trends?.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trends}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorPayment"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorCredit"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                      tickFormatter={(str) => format(new Date(str), "MMM d")}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fontWeight: 700, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      formatter={(val: any) => [formatCurrency(val), ""]}
                    />
                    <Area
                      type="monotone"
                      dataKey="payment"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPayment)"
                    />
                    <Area
                      type="monotone"
                      dataKey="credit"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorCredit)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <BarIcon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Not enough data for chart
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Revenue Distribution */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-4">
                Volume Distribution
              </h3>
              <div className="h-48">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-300">
                    <PieIcon className="w-8 h-8 opacity-20" />
                  </div>
                )}
              </div>
              <div className="mt-2 space-y-2">
                {pieData.map((d: any, i: number) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-[10px] font-bold text-slate-500">
                        {d.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black p-1 bg-slate-50 rounded">
                      {Math.round(
                        (d.value / (creditTotal + revenueTotal)) * 100,
                      )}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Position Summary */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  Consolidated Net Position
                </p>
                <p
                  className={cn(
                    "text-4xl font-black",
                    netPosition >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {netPosition >= 0 ? "+" : ""}
                  {formatCurrency(netPosition)}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Activity className="w-4 h-4" />
                  <span>
                    Calculated from {summary?.totalTransactions} operations
                  </span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-slate-300 leading-relaxed italic opacity-80">
                  {netPosition >= 0
                    ? "Exceptional collection day! Cash flow is positive and liquidity is high."
                    : "High credit extension today. Follow up with debtors to maintain balance."}
                </p>
              </div>
            </div>
          </div>

          {/* Integrity & Security */}
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Security Audit Trail
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Blockchain-style hash verification
                </p>
              </div>
              <button
                onClick={handleVerifyIntegrity}
                disabled={verifying}
                className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-900 rounded-2xl text-xs font-black hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {verifying ? "Auditing…" : "Run Verification"}
              </button>
            </div>

            {auditResult && (
              <div
                className={cn(
                  "p-5 rounded-[24px]",
                  auditResult.flagged === 0
                    ? "bg-emerald-50/50"
                    : "bg-rose-50/50",
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "p-2 rounded-xl",
                      auditResult.flagged === 0
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-600",
                    )}
                  >
                    {auditResult.flagged === 0 ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <AlertTriangle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-black",
                        auditResult.flagged === 0
                          ? "text-emerald-900"
                          : "text-rose-900",
                      )}
                    >
                      {auditResult.flagged === 0
                        ? "System Integrity Verified"
                        : "Integrity Compromised"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {auditResult.flagged === 0
                        ? "All cryptographic signatures match"
                        : `${auditResult.flagged} signatures failed match`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/50 p-3 rounded-xl text-center">
                    <p className="text-sm font-black text-slate-900">
                      {auditResult.total}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      Total
                    </p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl text-center">
                    <p className="text-sm font-black text-emerald-600">
                      {auditResult.valid}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      Valid
                    </p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl text-center text-rose-600">
                    <p className="text-sm font-black">{auditResult.flagged}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">
                      Flags
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
