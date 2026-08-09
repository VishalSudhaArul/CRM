import { query, queryOne } from "../lib/db";

export interface CreateProductInput {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  imageUrl?: string;
}

export async function createProduct(input: CreateProductInput) {
  const existing = await queryOne(`SELECT id FROM products WHERE sku = $1`, [input.sku]);

  if (existing) {
    throw new Error(`Product with SKU '${input.sku}' already exists`);
  }

  const res = await query(
    `INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.name,
      input.sku,
      input.category,
      input.unitPrice,
      input.currentStock,
      input.minimumStock,
      input.warehouseLocation,
      input.imageUrl || null,
    ]
  );

  if (res.length > 0) return res[0];
  return await queryOne(`SELECT * FROM products WHERE sku = $1`, [input.sku]);
}

export interface GetProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export async function getProducts(q: GetProductsQuery = {}) {
  const page = Math.max(1, q.page || 1);
  const limit = Math.max(1, Math.min(100, q.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (q.category) {
    params.push(q.category);
    conditions.push(`category = $${params.length}`);
  }

  if (q.search) {
    const sParam = `%${q.search}%`;
    params.push(sParam, sParam, sParam, sParam);
    const pLen = params.length;
    conditions.push(
      `(name LIKE $${pLen - 3} OR sku LIKE $${pLen - 2} OR category LIKE $${pLen - 1} OR warehouse_location LIKE $${pLen})`
    );
  }

  if (q.lowStock) {
    conditions.push(`current_stock <= minimum_stock`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) as total FROM products ${whereClause}`;
  const countRes = await queryOne(countSql, params);
  const total = Number(countRes?.total || countRes?.["count(*)"] || 0);

  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT * FROM products
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const products = await query(dataSql, dataParams);

  return {
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id: number) {
  const product = await queryOne(`SELECT * FROM products WHERE id = $1`, [id]);
  if (!product) return null;

  const stockMovements = await query(
    `SELECT sm.*, u.id as creator_id, u.name as creator_name, u.role as creator_role
     FROM stock_movements sm
     LEFT JOIN users u ON sm.created_by = u.id
     WHERE sm.product_id = $1
     ORDER BY sm.created_at DESC
     LIMIT 10`,
    [id]
  );

  const formattedMovements = stockMovements.map((sm) => ({
    ...sm,
    creator: sm.creatorId ? { id: sm.creatorId, name: sm.creatorName, role: sm.creatorRole } : null,
  }));

  const challanItems = await query(
    `SELECT ci.*, sc.challan_number, sc.status as challan_status, c.id as customer_id, c.name as customer_name, c.business_name as customer_business_name
     FROM challan_items ci
     JOIN sales_challans sc ON ci.challan_id = sc.id
     JOIN customers c ON sc.customer_id = c.id
     WHERE ci.product_id = $1
     ORDER BY ci.id DESC
     LIMIT 10`,
    [id]
  );

  const formattedChallanItems = challanItems.map((ci) => ({
    ...ci,
    challan: {
      challanNumber: ci.challanNumber,
      status: ci.challanStatus,
      customer: {
        id: ci.customerId,
        name: ci.customerName,
        businessName: ci.customerBusinessName,
      },
    },
  }));

  return {
    ...product,
    stockMovements: formattedMovements,
    challanItems: formattedChallanItems,
  };
}

export async function updateProduct(
  id: number,
  data: Partial<CreateProductInput>
) {
  const existing = await queryOne(`SELECT * FROM products WHERE id = $1`, [id]);
  if (!existing) {
    throw new Error(`Product with ID ${id} not found`);
  }

  const updates: string[] = [];
  const params: any[] = [id];

  if (data.name !== undefined) {
    params.push(data.name);
    updates.push(`name = $${params.length}`);
  }
  if (data.sku !== undefined && data.sku !== "") {
    if (data.sku !== existing.sku) {
      const skuExists = await queryOne(`SELECT id FROM products WHERE sku = $1 AND id != $2`, [data.sku, id]);
      if (skuExists) {
        throw new Error(`Product with SKU '${data.sku}' already exists`);
      }
    }
    params.push(data.sku);
    updates.push(`sku = $${params.length}`);
  }
  if (data.category !== undefined) {
    params.push(data.category);
    updates.push(`category = $${params.length}`);
  }
  if (data.unitPrice !== undefined && !isNaN(data.unitPrice)) {
    params.push(data.unitPrice);
    updates.push(`unit_price = $${params.length}`);
  }
  if (data.currentStock !== undefined && !isNaN(data.currentStock)) {
    params.push(data.currentStock);
    updates.push(`current_stock = $${params.length}`);
  }
  if (data.minimumStock !== undefined && !isNaN(data.minimumStock)) {
    params.push(data.minimumStock);
    updates.push(`minimum_stock = $${params.length}`);
  }
  if (data.warehouseLocation !== undefined) {
    params.push(data.warehouseLocation);
    updates.push(`warehouse_location = $${params.length}`);
  }
  if (data.imageUrl !== undefined) {
    params.push(data.imageUrl);
    updates.push(`image_url = $${params.length}`);
  }

  if (updates.length === 0) return existing;

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = $1 RETURNING *`;
  const res = await query(sql, params);
  return res[0] || (await queryOne(`SELECT * FROM products WHERE id = $1`, [id]));
}

export async function deleteProduct(id: number) {
  const existing = await queryOne(`SELECT * FROM products WHERE id = $1`, [id]);
  if (!existing) {
    throw new Error(`Product with ID ${id} not found`);
  }

  const linkedChallans = await queryOne(
    `SELECT id FROM challan_items WHERE product_id = $1 LIMIT 1`,
    [id]
  );
  if (linkedChallans) {
    throw new Error("Cannot delete product because it is associated with existing Sales Challans");
  }

  await query(`DELETE FROM stock_movements WHERE product_id = $1`, [id]);
  await query(`DELETE FROM products WHERE id = $1`, [id]);
  return existing;
}