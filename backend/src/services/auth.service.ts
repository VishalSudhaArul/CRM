import { queryOne, query } from "../lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "my_super_secret_crm_key_2026";

export type RoleType = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS" | string;

export async function loginUser(
  email: string,
  password: string
) {
  // Find user by email
  const user = await queryOne(
    `SELECT id, name, email, password, role, created_at FROM users WHERE email = $1`,
    [email]
  );

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password with hashed password
  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  // Create JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt || user.created_at,
    },
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: RoleType = "SALES"
) {
  const existingUser = await queryOne(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  );

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const res = await query(
    `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at`,
    [name, email, hashedPassword, role]
  );

  const user = res[0] || (await queryOne(`SELECT id, name, email, role, created_at FROM users WHERE email = $1`, [email]));

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt || user.created_at,
    },
  };
}