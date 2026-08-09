import React, { useEffect, useState } from "react";
import { Search, LayoutDashboard, Users, Package, ArrowUpDown, FileText, UserCheck, Plus, X, Command } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onOpenAction?: (action: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAction,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationCommands = [
    { id: "dashboard", name: "Executive Dashboard Overview", icon: LayoutDashboard, category: "Navigation" },
    { id: "customers", name: "Customers CRM Directory", icon: Users, category: "Navigation" },
    { id: "products", name: "Products & Stock Catalog", icon: Package, category: "Navigation" },
    { id: "inventory", name: "Stock Movements & Audit Logs", icon: ArrowUpDown, category: "Navigation" },
    { id: "challans", name: "Sales Challans & Dispatch", icon: FileText, category: "Navigation" },
    { id: "users", name: "System User Directory (Admin)", icon: UserCheck, category: "Navigation" },
  ];

  const actionCommands = [
    { id: "add-customer", name: "Create New Customer Account", icon: Plus, category: "Quick Actions" },
    { id: "add-product", name: "Add New Product SKU", icon: Plus, category: "Quick Actions" },
    { id: "create-challan", name: "Generate New Sales Challan", icon: Plus, category: "Quick Actions" },
    { id: "log-stock-in", name: "Log Stock Intake (+ IN)", icon: ArrowUpDown, category: "Quick Actions" },
    { id: "log-stock-out", name: "Log Stock Deduction (- OUT)", icon: ArrowUpDown, category: "Quick Actions" },
  ];

  const filteredNav = navigationCommands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = actionCommands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectNav = (id: string) => {
    onSelectTab(id);
    onClose();
  };

  const handleSelectAction = (id: string) => {
    if (onOpenAction) onOpenAction(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search workspace... (Esc to cancel)"
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-heading font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-4 text-xs">
          {filteredNav.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Navigation Module
              </div>
              <div className="space-y-1 mt-1">
                {filteredNav.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelectNav(cmd.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all font-heading font-semibold"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span>{cmd.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Module</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Quick Command Triggers
              </div>
              <div className="space-y-1 mt-1">
                {filteredActions.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelectAction(cmd.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all font-heading font-semibold"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span>{cmd.name}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-mono font-semibold">Action</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-slate-400 font-heading">
              No matching commands found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">↑↓</span>
            <span>Navigate</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">↵</span>
            <span>Select</span>
          </div>
          <div className="flex items-center space-x-1 font-heading font-semibold text-slate-600">
            <Command className="w-3 h-3 text-blue-600" />
            <span>APEX OS Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
