import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createSalesChallan,
  getSalesChallans,
  getSalesChallanById,
  updateChallanStatus,
} from "../services/challan.service";

export async function createChallanController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { customerId, items, status } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Customer ID and a non-empty list of items are required",
      });
    }

    if (status && !["DRAFT", "CONFIRMED"].includes(status)) {
      return res.status(400).json({
        message: "Initial status must be DRAFT or CONFIRMED",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User identity not found" });
    }

    const challan = await createSalesChallan({
      customerId: Number(customerId),
      items: items.map((i: any) => ({
        productId: Number(i.productId),
        quantity: Number(i.quantity),
      })),
      status,
      createdBy: userId,
    });

    return res.status(201).json({
      message: `Sales Challan ${challan.challanNumber} created successfully (${challan.status})`,
      challan,
    });
  } catch (error: any) {
    console.error("Create challan error:", error);
    return res.status(400).json({
      message: error.message || "Failed to create sales challan",
    });
  }
}

export async function getChallansController(
  req: AuthRequest,
  res: Response
) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const status = req.query.status as "DRAFT" | "CONFIRMED" | "CANCELLED" | undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;

    const data = await getSalesChallans({
      page,
      limit,
      status,
      search,
      customerId,
    });

    return res.status(200).json({
      message: "Sales challans fetched successfully",
      ...data,
    });
  } catch (error: any) {
    console.error("Get challans error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch sales challans",
    });
  }
}

export async function getChallanController(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid challan ID" });
    }

    const challan = await getSalesChallanById(id);
    if (!challan) {
      return res.status(404).json({ message: "Sales challan not found" });
    }

    return res.status(200).json({
      message: "Sales challan fetched successfully",
      challan,
    });
  } catch (error: any) {
    console.error("Get challan error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch sales challan",
    });
  }
}

export async function updateChallanStatusController(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid challan ID" });
    }

    const { status } = req.body;
    if (!status || !["CONFIRMED", "CANCELLED"].includes(status)) {
      return res.status(400).json({
        message: "Status to update must be CONFIRMED or CANCELLED",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User identity not found" });
    }

    const updatedChallan = await updateChallanStatus(id, status, userId);

    return res.status(200).json({
      message: `Sales Challan status updated to ${status} successfully`,
      challan: updatedChallan,
    });
  } catch (error: any) {
    console.error("Update challan status error:", error);
    return res.status(400).json({
      message: error.message || "Failed to update sales challan status",
    });
  }
}
