import React from "react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "./Badge";
import { LogOut, User as UserIcon, Layers } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-black text-xl">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-slate-900">
            APEX ERP <span className="text-blue-600 font-bold text-xs uppercase tracking-wider ml-1">CRM Suite</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Enterprise Operations System</p>
        </div>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center space-x-4">
        {user && (
          <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-semibold text-sm">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">{user.name}</span>
              <span className="text-[10px] text-slate-500">{user.email}</span>
            </div>
            <Badge text={user.role} variant={getRoleVariant(user.role)} size="sm" />
          </div>
        )}

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-500 transition-all shadow-xs"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
