import { query, queryOne, executeTransaction } from "../lib/db";

export interface ChallanItemInput {
  productId: number;
  quantity: number;
}

export interface CreateChallanInput {
  customerId: number;
  items: ChallanItemInput[];
  status?: "DRAFT" | "CONFIRMED";
  createdBy: number;
}

function generateChallanNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CHAL-${dateStr}-${randomSuffix}`;
}

export async function createSalesChallan(input: CreateChallanInput) {
  const { customerId, items, status = "DRAFT", createdBy } = input;

  if (!items || items.length === 0) {
    throw new Error("At least one product item is required for a sales challan");
  }

  // Validate customer existence
  const customer = await queryOne(`SELECT * FROM customers WHERE id = $1`, [customerId]);
  if (!customer) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  // Fetch all products requested
  const productIds = items.map((i) => i.productId);
  const placeholders = productIds.map((_, idx) => `$${idx + 1}`).join(", ");
  const products = await query(`SELECT * FROM products WHERE id IN (${placeholders})`, productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalQuantity = 0;
  let totalAmount = 0;

  const itemSnapshots = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity for product '${product.name}'. Must be a positive integer.`);
    }

    const itemUnitPrice = Number(product.unitPrice);
    const itemTotal = itemUnitPrice * item.quantity;
    totalQuantity += item.quantity;
    totalAmount += itemTotal;

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      unitPrice: itemUnitPrice,
      quantity: item.quantity,
      totalPrice: itemTotal,
    };
  });

  const challanNumber = generateChallanNumber();

  return await executeTransaction(async (txQuery) => {
    if (status === "CONFIRMED") {
      // Re-verify stock inside transaction and deduct
      for (const item of itemSnapshots) {
        const prodRows = await txQuery(`SELECT * FROM products WHERE id = $1`, [item.productId]);
        const prod = prodRows[0];

        if (!prod) {
          throw new Error(`Product '${item.productName}' not found`);
        }

        const currentStock = Number(prod.currentStock);
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available stock: ${currentStock}, Requested: ${item.quantity}`
          );
        }

        // Deduct stock
        await txQuery(`UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
          currentStock - item.quantity,
          item.productId,
        ]);

        // Record stock movement OUT
        await txQuery(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.productId, item.quantity, `Sales Challan #${challanNumber}`, createdBy]
        );
      }
    }

    // Insert sales_challans record
    const challanRes = await txQuery(
      `INSERT INTO sales_challans (challan_number, customer_id, total_quantity, total_amount, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [challanNumber, customerId, totalQuantity, totalAmount, status, createdBy]
    );

    const challanHeader = challanRes[0] || (await queryOne(`SELECT * FROM sales_challans WHERE challan_number = $1`, [challanNumber]));
    const challanId = challanHeader.id;

    // Insert challan items
    const insertedItems: any[] = [];
    for (const item of itemSnapshots) {
      const itemRes = await txQuery(
        `INSERT INTO challan_items (challan_id, product_id, product_name, product_sku, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [challanId, item.productId, item.productName, item.productSku, item.unitPrice, item.quantity, item.totalPrice]
      );
      if (itemRes.length > 0) insertedItems.push(itemRes[0]);
    }

    const creator = await queryOne(`SELECT id, name, email, role FROM users WHERE id = $1`, [createdBy]);

    return {
      ...challanHeader,
      customer,
      items: insertedItems,
      creator,
    };
  });
}

export async function updateChallanStatus(
  id: number,
  newStatus: "CONFIRMED" | "CANCELLED",
  updatedByUserId: number
) {
  const challan = await queryOne(`SELECT * FROM sales_challans WHERE id = $1`, [id]);

  if (!challan) {
    throw new Error(`Sales Challan with ID ${id} not found`);
  }

  if (challan.status === newStatus) {
    throw new Error(`Sales Challan is already in status '${newStatus}'`);
  }

  if (challan.status === "CANCELLED") {
    throw new Error("Cannot change status of a cancelled challan");
  }

  const items = await query(`SELECT * FROM challan_items WHERE challan_id = $1`, [id]);

  // DRAFT -> CONFIRMED
  if (challan.status === "DRAFT" && newStatus === "CONFIRMED") {
    return await executeTransaction(async (txQuery) => {
      for (const item of items) {
        const prodRows = await txQuery(`SELECT * FROM products WHERE id = $1`, [item.productId]);
        const prod = prodRows[0];

        if (!prod) {
          throw new Error(`Product '${item.productName}' not found`);
        }

        const currentStock = Number(prod.currentStock);
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Available stock: ${currentStock}, Requested: ${item.quantity}`
          );
        }

        await txQuery(`UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
          currentStock - item.quantity,
          item.productId,
        ]);

        await txQuery(
          `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.productId, item.quantity, `Confirmed Sales Challan #${challan.challanNumber}`, updatedByUserId]
        );
      }

      await txQuery(`UPDATE sales_challans SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
      return await getSalesChallanById(id);
    });
  }

  // CONFIRMED -> CANCELLED
  if (challan.status === "CONFIRMED" && newStatus === "CANCELLED") {
    return await executeTransaction(async (txQuery) => {
      for (const item of items) {
        const prodRows = await txQuery(`SELECT * FROM products WHERE id = $1`, [item.productId]);
        const prod = prodRows[0];

        if (prod) {
          const currentStock = Number(prod.currentStock);
          await txQuery(`UPDATE products SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
            currentStock + item.quantity,
            item.productId,
          ]);

          await txQuery(
            `INSERT INTO stock_movements (product_id, quantity_changed, movement_type, reason, created_by)
             VALUES ($1, $2, 'IN', $3, $4)`,
            [item.productId, item.quantity, `Cancelled Sales Challan #${challan.challanNumber}`, updatedByUserId]
          );
        }
      }

      await txQuery(`UPDATE sales_challans SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
      return await getSalesChallanById(id);
    });
  }

  // DRAFT -> CANCELLED
  if (challan.status === "DRAFT" && newStatus === "CANCELLED") {
    await query(`UPDATE sales_challans SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    return await getSalesChallanById(id);
  }
}

export interface GetChallansQuery {
  page?: number;
  limit?: number;
  status?: "DRAFT" | "CONFIRMED" | "CANCELLED";
  search?: string;
  customerId?: number;
}

export async function getSalesChallans(q: GetChallansQuery = {}) {
  const page = Math.max(1, q.page || 1);
  const limit = Math.max(1, Math.min(100, q.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (q.status) {
    params.push(q.status);
    conditions.push(`sc.status = $${params.length}`);
  }

  if (q.customerId) {
    params.push(q.customerId);
    conditions.push(`sc.customer_id = $${params.length}`);
  }

  if (q.search) {
    const sParam = `%${q.search}%`;
    params.push(sParam, sParam, sParam);
    const pLen = params.length;
    conditions.push(
      `(sc.challan_number LIKE $${pLen - 2} OR c.name LIKE $${pLen - 1} OR c.business_name LIKE $${pLen})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countSql = `
    SELECT COUNT(*) as total
    FROM sales_challans sc
    LEFT JOIN customers c ON sc.customer_id = c.id
    ${whereClause}
  `;
  const countRes = await queryOne(countSql, params);
  const total = Number(countRes?.total || countRes?.["count(*)"] || 0);

  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT 
      sc.*,
      c.id as cust_id, c.name as cust_name, c.business_name as cust_business_name, c.mobile as cust_mobile, c.email as cust_email,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role
    FROM sales_challans sc
    LEFT JOIN customers c ON sc.customer_id = c.id
    LEFT JOIN users u ON sc.created_by = u.id
    ${whereClause}
    ORDER BY sc.created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const rows = await query(dataSql, dataParams);

  const challans = await Promise.all(
    rows.map(async (r) => {
      const items = await query(`SELECT * FROM challan_items WHERE challan_id = $1`, [r.id]);
      return {
        id: r.id,
        challanNumber: r.challanNumber,
        customerId: r.customerId,
        totalQuantity: r.totalQuantity,
        totalAmount: r.totalAmount,
        status: r.status,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        customer: r.custId
          ? {
              id: r.custId,
              name: r.custName,
              businessName: r.custBusinessName,
              mobile: r.custMobile,
              email: r.custEmail,
            }
          : null,
        items,
        creator: r.userId
          ? {
              id: r.userId,
              name: r.userName,
              email: r.userEmail,
              role: r.userRole,
            }
          : null,
      };
    })
  );

  return {
    challans,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSalesChallanById(id: number) {
  const dataSql = `
    SELECT 
      sc.*,
      c.id as cust_id, c.name as cust_name, c.business_name as cust_business_name, c.mobile as cust_mobile, c.email as cust_email, c.address as cust_address, c.gst_number as cust_gst_number,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role
    FROM sales_challans sc
    LEFT JOIN customers c ON sc.customer_id = c.id
    LEFT JOIN users u ON sc.created_by = u.id
    WHERE sc.id = $1
  `;
  const r = await queryOne(dataSql, [id]);
  if (!r) return null;

  const rawItems = await query(
    `SELECT ci.*, p.current_stock as prod_stock
     FROM challan_items ci
     LEFT JOIN products p ON ci.product_id = p.id
     WHERE ci.challan_id = $1`,
    [id]
  );

  const items = rawItems.map((ci) => ({
    id: ci.id,
    challanId: ci.challanId,
    productId: ci.productId,
    productName: ci.productName,
    productSku: ci.productSku,
    unitPrice: ci.unitPrice,
    quantity: ci.quantity,
    totalPrice: ci.totalPrice,
    product: {
      id: ci.productId,
      name: ci.productName,
      sku: ci.productSku,
      currentStock: ci.prodStock || 0,
    },
  }));

  return {
    id: r.id,
    challanNumber: r.challanNumber,
    customerId: r.customerId,
    totalQuantity: r.totalQuantity,
    totalAmount: r.totalAmount,
    status: r.status,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    customer: r.custId
      ? {
          id: r.custId,
          name: r.custName,
          businessName: r.custBusinessName,
          mobile: r.custMobile,
          email: r.custEmail,
          address: r.custAddress,
          gstNumber: r.custGstNumber,
        }
      : null,
    items,
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
