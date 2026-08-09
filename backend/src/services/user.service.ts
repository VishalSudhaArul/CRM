import { query, queryOne } from "../lib/db";
import bcrypt from "bcrypt";

// Create User
export async function createUser(
  name: string,
  email: string,
  password: string,
  role: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const res = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role]
  );

  return res[0] || (await queryOne(`SELECT id, name, email, role, created_at FROM users WHERE email = $1`, [email]));
}

// Get All Users
export async function getUsers() {
  return await query(`SELECT id, name, email, role, created_at FROM users ORDER BY id ASC`);
}

// Get User By ID
export async function getUserById(id: number) {
  return await queryOne(`SELECT id, name, email, role, created_at FROM users WHERE id = $1`, [id]);
}

// Update User
export async function updateUser(
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  }
) {
  const existing = await queryOne(`SELECT id FROM users WHERE id = $1`, [id]);
  if (!existing) {
    throw new Error(`User with ID ${id} not found`);
  }

  const updates: string[] = [];
  const params: any[] = [id];

  if (data.name !== undefined) {
    params.push(data.name);
    updates.push(`name = $${params.length}`);
  }

  if (data.email !== undefined) {
    params.push(data.email);
    updates.push(`email = $${params.length}`);
  }

  if (data.role !== undefined) {
    params.push(data.role);
    updates.push(`role = $${params.length}`);
  }

  if (data.password !== undefined) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    params.push(hashedPassword);
    updates.push(`password = $${params.length}`);
  }

  if (updates.length === 0) {
    return await getUserById(id);
  }

  const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $1 RETURNING id, name, email, role, created_at`;
  const res = await query(sql, params);
  return res[0] || (await getUserById(id));
}

// Delete User
export async function deleteUser(id: number) {
  const existing = await getUserById(id);
  if (!existing) {
    throw new Error(`User with ID ${id} not found`);
  }
  await query(`DELETE FROM users WHERE id = $1`, [id]);
  return existing;
}