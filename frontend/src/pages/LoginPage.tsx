import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User, ShieldAlert, ArrowRight, Layers, UserPlus, ShieldCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS">("SALES");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode && !name) {
      setError("Please enter your full name");
      return;
    }
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isRegisterMode) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setIsRegisterMode(false);
    setEmail(roleEmail);
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden custom-scrollbar font-heading">
      {/* Background Lighting Accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] relative z-10">
        {/* Logo Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white mb-3">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-slate-900 font-heading">
            APEX<span className="text-blue-600 font-extrabold">.OS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-heading">
            {isRegisterMode ? "Create New User Account & Set Role" : "Apex Enterprise ERP & CRM Sign In Portal"}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isRegisterMode
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isRegisterMode
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-3 text-rose-700 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (For Register Mode) */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-heading"
                  required={isRegisterMode}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@erp.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                required
              />
            </div>
          </div>

          {/* Role Selection Field (For Register Mode) */}
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Select Required Role</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-heading font-semibold"
              >
                <option value="ADMIN">ADMIN — Full System Access & User Provisioning</option>
                <option value="SALES">SALES — Customer CRM & Sales Challans</option>
                <option value="WAREHOUSE">WAREHOUSE — Products & Stock Movements</option>
                <option value="ACCOUNTS">ACCOUNTS — Financial & Read-Only Audits</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 transition-all mt-2 font-heading"
          >
            <span>
              {loading
                ? "Processing Request..."
                : isRegisterMode
                ? "Create Account & Sign In"
                : "Sign In to Workspace"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Footer Link */}
        <div className="mt-6 text-center">
          {isRegisterMode ? (
            <p className="text-xs text-slate-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                }}
                className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 ml-1"
              >
                Sign In here
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-600">
              Need a new user account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setError(null);
                }}
                className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 ml-1 inline-flex items-center space-x-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </p>
          )}
        </div>

        {/* Role Quick Sign In Presets */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 mb-2.5 text-center uppercase tracking-wider font-mono">
            Sign In With Required Roles
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickLogin("admin@erp.com")}
              className="p-2 rounded-xl bg-sky-50 border border-sky-200/80 hover:border-sky-300 text-sky-900 text-left transition-colors"
            >
              <div className="font-bold text-sky-700 font-mono text-[11px]">ADMIN Role</div>
              <div className="text-[10px] text-sky-600/80 font-mono">admin@erp.com</div>
            </button>

            <button
              onClick={() => handleQuickLogin("sales@erp.com")}
              className="p-2 rounded-xl bg-blue-50 border border-blue-200/80 hover:border-blue-300 text-blue-900 text-left transition-colors"
            >
              <div className="font-bold text-blue-700 font-mono text-[11px]">SALES Role</div>
              <div className="text-[10px] text-blue-600/80 font-mono">sales@erp.com</div>
            </button>

            <button
              onClick={() => handleQuickLogin("warehouse@erp.com")}
              className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 hover:border-amber-300 text-amber-900 text-left transition-colors"
            >
              <div className="font-bold text-amber-800 font-mono text-[11px]">WAREHOUSE Role</div>
              <div className="text-[10px] text-amber-700/80 font-mono">warehouse@erp.com</div>
            </button>

            <button
              onClick={() => handleQuickLogin("accounts@erp.com")}
              className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 hover:border-emerald-300 text-emerald-900 text-left transition-colors"
            >
              <div className="font-bold text-emerald-700 font-mono text-[11px]">ACCOUNTS Role</div>
              <div className="text-[10px] text-emerald-600/80 font-mono">accounts@erp.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
