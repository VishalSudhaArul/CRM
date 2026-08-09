import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createStockMovement,
  getStockMovements,
  getStockMovementById,
} from "../services/stockMovement.service";

export async function createStockMovementController(
  req: AuthRequest,
  res: Response
) {
  try {
    const { productId, quantityChanged, movementType, reason } = req.body;

    if (!productId || quantityChanged === undefined || !movementType || !reason) {
      return res.status(400).json({
        message: "Product ID, quantity changed, movement type (IN/OUT), and reason are required",
      });
    }

    if (!["IN", "OUT"].includes(movementType)) {
      return res.status(400).json({
        message: "Movement type must be IN or OUT",
      });
    }

    const qty = Number(quantityChanged);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return res.status(400).json({
        message: "Quantity changed must be a positive integer",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User identity not found" });
    }

    const movement = await createStockMovement({
      productId: Number(productId),
      quantityChanged: qty,
      movementType,
      reason,
      createdBy: userId,
    });

    return res.status(201).json({
      message: `Stock movement logged successfully. Stock adjusted (${movementType} ${qty})`,
      stockMovement: movement,
    });
  } catch (error: any) {
    console.error("Create stock movement error:", error);
    return res.status(400).json({
      message: error.message || "Failed to log stock movement",
    });
  }
}

export async function getStockMovementsController(
  req: AuthRequest,
  res: Response
) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const movementType = req.query.movementType as "IN" | "OUT" | undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const data = await getStockMovements({
      page,
      limit,
      productId,
      movementType,
      search,
    });

    return res.status(200).json({
      message: "Stock movements fetched successfully",
      ...data,
    });
  } catch (error: any) {
    console.error("Get stock movements error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch stock movements",
    });
  }
}

export async function getStockMovementController(
  req: AuthRequest,
  res: Response
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid stock movement ID" });
    }

    const movement = await getStockMovementById(id);
    if (!movement) {
      return res.status(404).json({ message: "Stock movement not found" });
    }

    return res.status(200).json({
      message: "Stock movement fetched successfully",
      stockMovement: movement,
    });
  } catch (error: any) {
    console.error("Get stock movement error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch stock movement",
    });
  }
}
