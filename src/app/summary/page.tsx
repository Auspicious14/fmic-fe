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
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
      <p className="text-xs font-bold text-muted uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl font-black text-foreground mt-1 leading-tight font-syne">
        {value}
      </p>
      {subLabel && <p className="text-xs text-muted mt-1">{subLabel}</p>}
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
    <div className="pt-8 min-h-screen bg-background">
      <header className="px-6 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground leading-none tracking-tight font-syne">
            Insights
          </h1>
          <p className="text-xs text-muted font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Live Insights • {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-3 bg-surface rounded-xl shadow-sm border border-border text-muted active:scale-95 transition-transform"
          >
            {isFetching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCcw className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="p-3 bg-foreground rounded-xl shadow-lg text-background active:scale-95 transition-transform"
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
                className="h-28 bg-surface rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-surface rounded-3xl animate-pulse" />
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
              color="text-danger"
              bg="bg-danger/10"
            />
            <StatCard
              label="Today's Inflow (Payments)"
              value={formatCurrency(revenueTotal)}
              subLabel="Cash collected"
              icon={TrendingDown}
              color="text-success"
              bg="bg-success/10"
            />
            <StatCard
              label="Customer Reach"
              value={summary?.uniqueCustomers || 0}
              subLabel="Active buyers today"
              icon={Users}
              color="text-accent"
              bg="bg-accent/10"
            />
            <StatCard
              label="Ops Volume"
              value={summary?.totalTransactions || 0}
              subLabel="Total events logged"
              icon={Activity}
              color="text-muted"
              bg="bg-elevated"
            />
          </div>

          {/* Performance Trend Chart */}
          <div className="bg-surface border border-border rounded-[32px] p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-foreground font-syne uppercase tracking-wider">
                  Weekly Volume
                </h3>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted)", fontWeight: 700 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted)", fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "0.5px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--accent)"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Revenue Distribution */}
            <div className="bg-surface border border-border rounded-[32px] p-6 shadow-sm">
              <h3 className="text-sm font-black text-foreground mb-4 font-syne uppercase tracking-wider">
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
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--surface)",
                          border: "0.5px solid var(--border)",
                          borderRadius: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted">
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
                      <span className="text-[10px] font-bold text-muted">
                        {d.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black p-1 bg-elevated rounded text-foreground">
                      {Math.round(
                        (d.value / (creditTotal + revenueTotal || 1)) * 100,
                      )}
                      %
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Position Summary */}
            <div className="bg-foreground rounded-[32px] p-8 text-background flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-4">
                  Consolidated Net Position
                </p>
                <p
                  className={cn(
                    "text-4xl font-black font-syne leading-none tracking-tighter",
                    netPosition >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {formatCurrency(Math.abs(netPosition))}
                </p>
                <p className="text-[10px] font-bold opacity-40 mt-3 flex items-center gap-2">
                  {netPosition >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  {netPosition >= 0 ? "SURPLUS POSITION" : "DEFICIT POSITION"}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-background/10">
                <button
                  onClick={handleVerifyIntegrity}
                  disabled={verifying}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-3 h-3 text-accent" />
                      Verify Integrity
                    </p>
                    <p className="text-[10px] font-bold opacity-40 mt-1">
                      Run ledger audit check
                    </p>
                  </div>
                  <div className="p-2 bg-background/10 rounded-xl group-active:scale-90 transition-transform">
                    {verifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Integrity & Security */}
          <div className="bg-surface border border-border rounded-[32px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-foreground font-syne uppercase tracking-wider">
                  Security Audit Trail
                </h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">
                  Blockchain-style hash verification
                </p>
              </div>
              <button
                onClick={handleVerifyIntegrity}
                disabled={verifying}
                className="flex items-center gap-2 px-5 py-3 bg-elevated text-foreground rounded-2xl text-xs font-black hover:bg-surface border border-transparent hover:border-border transition-all disabled:opacity-50 active:scale-95"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 text-accent" />
                )}
                {verifying ? "Auditing…" : "Run Verification"}
              </button>
            </div>

            {auditResult && (
              <div
                className={cn(
                  "p-5 rounded-[24px]",
                  auditResult.flagged === 0
                    ? "bg-success/5"
                    : "bg-danger/5",
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      "p-2 rounded-xl",
                      auditResult.flagged === 0
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger",
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
                        "text-sm font-black font-syne uppercase tracking-tight",
                        auditResult.flagged === 0
                          ? "text-success"
                          : "text-danger",
                      )}
                    >
                      {auditResult.flagged === 0
                        ? "System Integrity Verified"
                        : "Integrity Compromised"}
                    </p>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                      {auditResult.flagged === 0
                        ? "All cryptographic signatures match"
                        : `${auditResult.flagged} signatures failed match`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface p-3 rounded-xl text-center border border-border/50">
                    <p className="text-sm font-black text-foreground">
                      {auditResult.total}
                    </p>
                    <p className="text-[9px] text-muted font-bold uppercase">
                      Total
                    </p>
                  </div>
                  <div className="bg-surface p-3 rounded-xl text-center border border-border/50">
                    <p className="text-sm font-black text-success">
                      {auditResult.valid}
                    </p>
                    <p className="text-[9px] text-muted font-bold uppercase">
                      Valid
                    </p>
                  </div>
                  <div className="bg-surface p-3 rounded-xl text-center border border-border/50">
                    <p className="text-sm font-black text-danger">{auditResult.flagged}</p>
                    <p className="text-[9px] text-muted font-bold uppercase">
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
