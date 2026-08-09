import React, { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { Badge } from "../components/Badge";
import { BentoCard } from "../components/BentoCard";
import {
  Users,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";

interface DashboardStats {
  customers: {
    total: number;
    active: number;
    leads: number;
  };
  inventory: {
    totalProducts: number;
    lowStockCount: number;
    totalValue: number;
  };
  sales: {
    totalChallans: number;
    confirmed: number;
    draft: number;
    confirmedRevenue: number;
  };
  recentMovements: any[];
  recentChallans: any[];
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get("/dashboard/stats");
      setStats(res.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-mono font-semibold tracking-wider">Syncing Workspace Telemetry...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-heading font-semibold">
        {error || "Failed to load dashboard metrics"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold font-heading tracking-tight text-white">System Telemetry & Operations</h2>
            <Badge text="LIVE BENTO" variant="info" size="sm" />
          </div>
          <p className="text-xs text-slate-300 font-heading mt-1">Real-time aggregate performance metrics and transactional stream</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold font-heading transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* ASYMMETRIC BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Bento Item 1 (Wide): Confirmed Revenue */}
        <BentoCard glowColor="emerald" className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                Confirmed Sales Revenue
              </span>
              <h3 className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                ₹{stats.sales.confirmedRevenue.toLocaleString("en-IN")}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 font-heading">
            <div className="flex items-center text-emerald-600 font-semibold space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.sales.confirmed} Confirmed Orders</span>
            </div>
            <span className="text-slate-500 font-mono">{stats.sales.draft} Drafts Pending</span>
          </div>
        </BentoCard>

        {/* Bento Item 2: Customer CRM Health */}
        <BentoCard glowColor="blue">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider font-mono">
              CRM Accounts
            </span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.customers.total}</div>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600 font-heading text-[11px]">
              <span>Active Accounts</span>
              <span className="font-bold text-emerald-600 font-mono">{stats.customers.active}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${(stats.customers.active / (stats.customers.total || 1)) * 100}%` }}
              />
            </div>
          </div>
        </BentoCard>

        {/* Bento Item 3: Low Stock Radar */}
        <BentoCard glowColor="amber">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider font-mono">
              Stock Warning
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{stats.inventory.lowStockCount} SKUs</div>
          <p className="text-[11px] text-amber-700 mt-2 font-heading leading-relaxed">
            Items requiring immediate warehouse restock intake.
          </p>
        </BentoCard>
      </div>

      {/* SECOND ROW BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Stock Movements Stream */}
        <BentoCard glowColor="blue" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm font-heading">Real-time Stock Movement Stream</h3>
            </div>
            <Badge text="LOG AUDIT" variant="info" size="sm" />
          </div>

          {stats.recentMovements.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center font-heading">No stock movement telemetry logged yet.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.recentMovements.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Badge
                      text={m.movementType}
                      variant={m.movementType === "IN" ? "success" : "danger"}
                      size="sm"
                    />
                    <div>
                      <div className="font-bold text-slate-900 font-heading">{m.product?.name || "Product"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{m.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold font-mono ${m.movementType === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                      {m.movementType === "IN" ? "+" : "-"}{m.quantityChanged} units
                    </div>
                    <div className="text-[10px] text-slate-500 font-heading">
                      By {m.creator?.name} ({m.creator?.role})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        {/* Inventory Asset Valuation */}
        <BentoCard glowColor="cyan">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-600" />
              <h3 className="font-bold text-slate-900 text-sm font-heading">Inventory Asset Health</h3>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 font-mono">
                Total Stock Valuation
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                ₹{stats.inventory.totalValue.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="space-y-2.5 font-heading">
              <div className="flex justify-between text-slate-600">
                <span>Active Catalog SKUs:</span>
                <span className="font-bold text-slate-900 font-mono">{stats.inventory.totalProducts}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Challan Orders:</span>
                <span className="font-bold text-slate-900 font-mono">{stats.sales.totalChallans}</span>
              </div>
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
};
