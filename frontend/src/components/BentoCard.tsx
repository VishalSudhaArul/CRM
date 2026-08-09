import React from "react";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "blue" | "indigo" | "purple" | "emerald" | "amber" | "rose" | "cyan";
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = "",
  glowColor = "blue",
}) => {
  const getGlowStyle = () => {
    switch (glowColor) {
      case "purple":
        return "border-purple-200/80 hover:border-purple-300 shadow-[0_4px_20px_-4px_rgba(147,51,234,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(147,51,234,0.12)]";
      case "emerald":
        return "border-emerald-200/80 hover:border-emerald-300 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(16,185,129,0.12)]";
      case "amber":
        return "border-amber-200/80 hover:border-amber-300 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(245,158,11,0.12)]";
      case "rose":
        return "border-rose-200/80 hover:border-rose-300 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(244,63,94,0.12)]";
      case "cyan":
        return "border-cyan-200/80 hover:border-cyan-300 shadow-[0_4px_20px_-4px_rgba(6,182,212,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(6,182,212,0.12)]";
      case "indigo":
        return "border-blue-200/80 hover:border-blue-300 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(37,99,235,0.12)]";
      default:
        return "border-slate-200/80 hover:border-blue-200 shadow-[0_4px_20px_-4px_rgba(37,99,235,0.06)] hover:shadow-[0_8px_25px_-5px_rgba(37,99,235,0.12)]";
    }
  };

  return (
    <div
      className={`bg-white border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden ${getGlowStyle()} ${className}`}
    >
      {/* Top Subtle Line Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      {children}
    </div>
  );
};
