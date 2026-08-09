import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service";

export async function getDashboardStatsController(
  req: Request,
  res: Response
) {
  try {
    const stats = await getDashboardStats();
    return res.status(200).json({
      message: "Dashboard metrics fetched successfully",
      stats,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch dashboard metrics",
    });
  }
}
