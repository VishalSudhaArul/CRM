import React, { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DynamicIslandNav } from "./components/DynamicIslandNav";
import { CommandPalette } from "./components/CommandPalette";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomerPage } from "./pages/CustomerPage";
import { ProductPage } from "./pages/ProductPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ChallanPage } from "./pages/ChallanPage";
import { UserPage } from "./pages/UserPage";

export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardPage />;
      case "customers":
        return <CustomerPage />;
      case "products":
        return <ProductPage />;
      case "inventory":
        return <InventoryPage />;
      case "challans":
        return <ChallanPage />;
      case "users":
        return user.role === "ADMIN" ? <UserPage /> : <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative selection:bg-blue-600 selection:text-white">
      {/* Floating Dynamic Island Navigation Header */}
      <DynamicIslandNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Global Command Launcher Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Bento Workspace Content View */}
      <main className="pt-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
