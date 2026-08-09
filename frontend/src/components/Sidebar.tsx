import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowUpDown,
  FileText,
  UserCheck,
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      id: "customers",
      label: "Customers CRM",
      icon: Users,
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      id: "inventory",
      label: "Stock Movements",
      icon: ArrowUpDown,
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      id: "challans",
      label: "Sales Challans",
      icon: FileText,
      roles: ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"],
    },
    {
      id: "users",
      label: "User Management",
      icon: UserCheck,
      roles: ["ADMIN"],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 shadow-xs">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const isAllowed = user && item.roles.includes(user.role);
          if (!isAllowed) return null;

          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Role Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
        <p className="font-bold text-slate-800 mb-0.5">Active Role: {user?.role}</p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {user?.role === "ADMIN" && "Full administrative privileges enabled."}
          {user?.role === "SALES" && "CRM, Lead management & Sales Challan creation enabled."}
          {user?.role === "WAREHOUSE" && "Stock movement & Product inventory management enabled."}
          {user?.role === "ACCOUNTS" && "Read-only access to records & challan verification."}
        </p>
      </div>
    </aside>
  );
};
