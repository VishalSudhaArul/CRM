import React from "react";

interface BadgeProps {
  text: string;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "neutral" | "purple";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = "neutral", size = "md" }) => {
  const getStyle = () => {
    switch (variant) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs font-semibold";
      case "danger":
        return "bg-rose-50 text-rose-700 border-rose-200 shadow-2xs font-semibold";
      case "warning":
        return "bg-amber-50 text-amber-800 border-amber-200 shadow-2xs font-semibold";
      case "primary":
      case "info":
        return "bg-blue-50 text-blue-700 border-blue-200 shadow-2xs font-semibold";
      case "purple":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 shadow-2xs font-semibold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 font-semibold";
    }
  };

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses} ${getStyle()} font-mono tracking-wider transition-all`}
    >
      {text}
    </span>
  );
};
