import { query, queryOne, executeTransaction } from "../lib/db";

export interface CreateStockMovementInput {
  productId: number;
  quantityChanged: number;
  movementType: "IN" | "OUT";
  reason: string;
  createdBy: number;
}

export async function createStockMovement(input: CreateStockMovementInput) {
  const { productId, quantityChanged, movementType, reason, createdBy } = input;

  if (quantityChanged <= 0) {
    throw new Error("Quantity changed must be a positive integer");
  }

  return await executeTransaction(async (txQuery) => {
    const prodRows = await txQuery(`SELECT * FROM products WHERE id = $1`, [productId]);
    const product = prodRows[0];

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    let updatedStock = Number(product.currentStock);

    if (movementType === "IN") {
      updatedStock += quantityChanged;
    } else if (movementType === "OUT") {
      if (updatedStock < quantityChanged) {
        throw new Error(
          `Insufficient stock for product '${product.name}' (SKU: ${product.sku}). Available stock: ${updatedStock}, Requested reduction: ${quantityChanged}`
        );
      }
      updatedStock -= quantityChanged;
    } else {
      throw new Error("Movement type must be IN or OUT");
    }

    // Update product stock
    await txQuery(`UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
      updatedStock,
      productId,
    ]);

    // Insert stock movement record
    const movRes = await txQuery(
      `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [productId, quantityChanged, movementType, reason, createdBy]
    );

    const movement = movRes[0] || (await queryOne(`SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY id DESC LIMIT 1`, [productId]));

    // Fetch related product and creator
    const creator = await queryOne(`SELECT id, name, email, role FROM users WHERE id = $1`, [createdBy]);
    const updatedProd = await queryOne(`SELECT id, name, sku, category, unit_price, current_stock, minimum_stock FROM products WHERE id = $1`, [productId]);

    return {
      ...movement,
      product: updatedProd,
      creator,
    };
  });
}

export interface GetStockMovementsQuery {
  page?: number;
  limit?: number;
  productId?: number;
  movementType?: "IN" | "OUT";
  search?: string;
}

export async function getStockMovements(q: GetStockMovementsQuery = {}) {
  const page = Math.max(1, q.page || 1);
  const limit = Math.max(1, Math.min(100, q.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (q.productId) {
    params.push(q.productId);
    conditions.push(`sm.product_id = $${params.length}`);
  }

  if (q.movementType) {
    params.push(q.movementType);
    conditions.push(`sm.movement_type = $${params.length}`);
  }

  if (q.search) {
    const sParam = `%${q.search}%`;
    params.push(sParam, sParam, sParam);
    const pLen = params.length;
    conditions.push(
      `(sm.reason LIKE $${pLen - 2} OR p.name LIKE $${pLen - 1} OR p.sku LIKE $${pLen})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countSql = `
    SELECT COUNT(*) as total
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    ${whereClause}
  `;
  const countRes = await queryOne(countSql, params);
  const total = Number(countRes?.total || countRes?.["count(*)"] || 0);

  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT 
      sm.*,
      p.id as prod_id, p.name as prod_name, p.sku as prod_sku, p.category as prod_category,
      p.unit_price as prod_unit_price, p.current_stock as prod_current_stock, p.minimum_stock as prod_minimum_stock,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.created_by = u.id
    ${whereClause}
    ORDER BY sm.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const rows = await query(dataSql, dataParams);

  const movements = rows.map((r) => ({
    id: r.id,
    productId: r.productId,
    quantityChanged: r.quantityChanged,
    movementType: r.movementType,
    reason: r.reason,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    product: r.prodId
      ? {
          id: r.prodId,
          name: r.prodName,
          sku: r.prodSku,
          category: r.prodCategory,
          unitPrice: r.prodUnitPrice,
          currentStock: r.prodCurrentStock,
          minimumStock: r.prodMinimumStock,
        }
      : null,
    creator: r.userId
      ? {
          id: r.userId,
          name: r.userName,
          email: r.userEmail,
          role: r.userRole,
        }
      : null,
  }));

  return {
    movements,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getStockMovementById(id: number) {
  const dataSql = `
    SELECT 
      sm.*,
      p.id as prod_id, p.name as prod_name, p.sku as prod_sku, p.category as prod_category,
      p.unit_price as prod_unit_price, p.current_stock as prod_current_stock, p.minimum_stock as prod_minimum_stock,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role
    FROM stock_movements sm
    LEFT JOIN products p ON sm.product_id = p.id
    LEFT JOIN users u ON sm.created_by = u.id
    WHERE sm.id = $1
  `;
  const r = await queryOne(dataSql, [id]);
  if (!r) return null;

  return {
    id: r.id,
    productId: r.productId,
    quantityChanged: r.quantityChanged,
    movementType: r.movementType,
    reason: r.reason,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    product: r.prodId
      ? {
          id: r.prodId,
          name: r.prodName,
          sku: r.prodSku,
          category: r.prodCategory,
          unitPrice: r.prodUnitPrice,
          currentStock: r.prodCurrentStock,
          minimumStock: r.prodMinimumStock,
        }
      : null,
    creator: r.userId
      ? {
          id: r.userId,
          name: r.userName,
          email: r.userEmail,
          role: r.userRole,
        }
      : null,
  };
}
