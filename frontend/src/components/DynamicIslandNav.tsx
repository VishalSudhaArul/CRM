import React from "react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "./Badge";
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowUpDown,
  FileText,
  UserCheck,
  Search,
  LogOut,
  Layers,
} from "lucide-react";

interface DynamicIslandNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
}

export const DynamicIslandNav: React.FC<DynamicIslandNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCommandPalette,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    { id: "customers", label: "CRM", icon: Users, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    { id: "products", label: "Products", icon: Package, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    { id: "inventory", label: "Inventory", icon: ArrowUpDown, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    { id: "challans", label: "Dispatch", icon: FileText, roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"] },
    { id: "users", label: "Users", icon: UserCheck, roles: ["ADMIN"] },
  ];

  const getRoleVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "info";
      case "SALES":
        return "info";
      case "WAREHOUSE":
        return "warning";
      case "ACCOUNTS":
        return "success";
      default:
        return "neutral";
    }
  };

  return (
    <header className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-6xl">
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full px-5 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] flex items-center justify-between transition-all">
        {/* Brand Logo Pill */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black tracking-wider text-slate-900 font-heading">
            APEX<span className="text-blue-600 font-extrabold">.OS</span>
          </span>
        </div>

        {/* Dynamic Island Nav Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
          {navItems.map((item) => {
            const isAllowed = user && item.roles.includes(user.role);
            if (!isAllowed) return null;

            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all font-heading ${
                  isActive
                    ? "bg-white text-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.15)] border border-blue-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Hub & Command Launcher */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenCommandPalette}
            title="Open Command Launcher (Ctrl+K)"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden lg:inline text-[11px] text-slate-500 font-mono font-semibold">Cmd + K</span>
          </button>

          {user && (
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[11px] font-bold text-slate-800 hidden sm:inline font-heading">{user.name.split(" ")[0]}</span>
              <Badge text={user.role} variant={getRoleVariant(user.role)} size="sm" />
            </div>
          )}

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
