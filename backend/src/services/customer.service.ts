import { query, queryOne } from "../lib/db";

export interface CreateCustomerInput {
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address: string;
  status?: "LEAD" | "ACTIVE" | "INACTIVE";
  followUpDate?: Date | string;
  notes?: string;
}

export async function createCustomer(input: CreateCustomerInput) {
  const existing = await queryOne(
    `SELECT id FROM customers WHERE email = $1`,
    [input.email]
  );

  if (existing) {
    throw new Error(`Customer with email '${input.email}' already exists`);
  }

  const followUp = input.followUpDate
    ? new Date(input.followUpDate).toISOString()
    : null;

  const res = await query(
    `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.name,
      input.mobile,
      input.email,
      input.businessName,
      input.gstNumber || null,
      input.customerType,
      input.address,
      input.status || "LEAD",
      followUp,
      input.notes || null,
    ]
  );

  if (res.length > 0) return res[0];
  return await queryOne(`SELECT * FROM customers WHERE email = $1`, [input.email]);
}

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  status?: "LEAD" | "ACTIVE" | "INACTIVE";
}

export async function getCustomers(q: GetCustomersQuery = {}) {
  const page = Math.max(1, q.page || 1);
  const limit = Math.max(1, Math.min(100, q.limit || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (q.customerType) {
    params.push(q.customerType);
    conditions.push(`customer_type = $${params.length}`);
  }

  if (q.status) {
    params.push(q.status);
    conditions.push(`status = $${params.length}`);
  }

  if (q.search) {
    const sParam = `%${q.search}%`;
    params.push(sParam, sParam, sParam, sParam, sParam);
    const pLen = params.length;
    conditions.push(
      `(name LIKE $${pLen - 4} OR email LIKE $${pLen - 3} OR mobile LIKE $${pLen - 2} OR business_name LIKE $${pLen - 1} OR gst_number LIKE $${pLen})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
  const countRes = await queryOne(countSql, params);
  const total = Number(countRes?.total || countRes?.["count(*)"] || 0);

  const dataParams = [...params, limit, offset];
  const dataSql = `
    SELECT * FROM customers
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const customers = await query(dataSql, dataParams);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(id: number) {
  const customer = await queryOne(`SELECT * FROM customers WHERE id = $1`, [id]);
  if (!customer) return null;

  const salesChallans = await query(
    `SELECT * FROM sales_challans WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [id]
  );

  return {
    ...customer,
    salesChallans,
  };
}

export async function updateCustomer(
  id: number,
  data: Partial<CreateCustomerInput>
) {
  const existing = await queryOne(`SELECT * FROM customers WHERE id = $1`, [id]);
  if (!existing) {
    throw new Error(`Customer with ID ${id} not found`);
  }

  const updates: string[] = [];
  const params: any[] = [id];

  if (data.name !== undefined) {
    params.push(data.name);
    updates.push(`name = $${params.length}`);
  }
  if (data.mobile !== undefined) {
    params.push(data.mobile);
    updates.push(`mobile = $${params.length}`);
  }
  if (data.email !== undefined) {
    params.push(data.email);
    updates.push(`email = $${params.length}`);
  }
  if (data.businessName !== undefined) {
    params.push(data.businessName);
    updates.push(`business_name = $${params.length}`);
  }
  if (data.gstNumber !== undefined) {
    params.push(data.gstNumber);
    updates.push(`gst_number = $${params.length}`);
  }
  if (data.customerType !== undefined) {
    params.push(data.customerType);
    updates.push(`customer_type = $${params.length}`);
  }
  if (data.address !== undefined) {
    params.push(data.address);
    updates.push(`address = $${params.length}`);
  }
  if (data.status !== undefined) {
    params.push(data.status);
    updates.push(`status = $${params.length}`);
  }
  if (data.followUpDate !== undefined) {
    params.push(data.followUpDate ? new Date(data.followUpDate).toISOString() : null);
    updates.push(`follow_up_date = $${params.length}`);
  }
  if (data.notes !== undefined) {
    params.push(data.notes);
    updates.push(`notes = $${params.length}`);
  }

  if (updates.length === 0) return existing;

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const sql = `UPDATE customers SET ${updates.join(", ")} WHERE id = $1 RETURNING *`;
  const res = await query(sql, params);
  return res[0] || (await queryOne(`SELECT * FROM customers WHERE id = $1`, [id]));
}

export async function addFollowUpNote(
  id: number,
  notes: string,
  followUpDate?: Date | string
) {
  const existing = await queryOne(`SELECT * FROM customers WHERE id = $1`, [id]);
  if (!existing) {
    throw new Error(`Customer with ID ${id} not found`);
  }

  const dateTag = new Date().toISOString().slice(0, 10);
  const combinedNotes = existing.notes
    ? `${existing.notes}\n[${dateTag}]: ${notes}`
    : `[${dateTag}]: ${notes}`;

  return await updateCustomer(id, {
    notes: combinedNotes,
    ...(followUpDate !== undefined && { followUpDate }),
  });
}

export async function deleteCustomer(id: number) {
  const existing = await queryOne(`SELECT * FROM customers WHERE id = $1`, [id]);
  if (!existing) {
    throw new Error(`Customer with ID ${id} not found`);
  }

  const linkedChallans = await queryOne(
    `SELECT id FROM sales_challans WHERE customer_id = $1 LIMIT 1`,
    [id]
  );
  if (linkedChallans) {
    throw new Error("Cannot delete customer because they are associated with existing Sales Challans");
  }

  await query(`DELETE FROM customers WHERE id = $1`, [id]);
  return existing;
}