import "dotenv/config";
import path from "path";
import { Pool } from "pg";
import Database from "better-sqlite3";

const databaseUrl = process.env.DATABASE_URL || "";
const isPostgres = databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://") || process.env.DB_TYPE === "postgres";

let pgPool: Pool | null = null;
let sqliteDb: any = null;

if (isPostgres) {
  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
  console.log("[DB Engine] Connected using PostgreSQL Pool");
} else {
  const dbPath = path.resolve(__dirname, "../../dev.db");
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma("foreign_keys = ON");
  console.log(`[DB Engine] Connected using SQLite (${dbPath})`);
}

function toCamelCaseKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function transformRow(row: any): any {
  if (!row || typeof row !== "object" || row instanceof Date) return row;
  if (Array.isArray(row)) return row.map(transformRow);

  const transformed: any = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = toCamelCaseKey(key);
    if (value !== null && typeof value === "object" && !(value instanceof Date)) {
      transformed[camelKey] = transformRow(value);
    } else {
      transformed[camelKey] = value;
    }
  }
  return transformed;
}

function prepareSqliteQuery(sql: string, params: any[] = []) {
  const paramMatches = Array.from(sql.matchAll(/\$(\d+)/g));
  const sqliteSql = sql.replace(/\$\d+/g, "?");

  let sqliteParams = params;
  if (paramMatches.length > 0) {
    sqliteParams = paramMatches.map((m) => {
      const idx = parseInt(m[1], 10) - 1;
      return params[idx];
    });
  }

  return { sqliteSql, sqliteParams };
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (isPostgres && pgPool) {
    const res = await pgPool.query(sql, params);
    return res.rows.map(transformRow);
  } else if (sqliteDb) {
    const { sqliteSql, sqliteParams } = prepareSqliteQuery(sql, params);
    const stmt = sqliteDb.prepare(sqliteSql);
    let rows: any[];
    if (sqliteSql.trim().toUpperCase().startsWith("SELECT") || sqliteSql.includes("RETURNING")) {
      rows = stmt.all(...sqliteParams);
    } else {
      const info = stmt.run(...sqliteParams);
      rows = info.changes ? [{ id: info.lastInsertRowid }] : [];
    }
    return rows.map(transformRow);
  }
  throw new Error("No database connection available");
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function executeTransaction<T>(
  callback: (txQuery: (sql: string, params?: any[]) => Promise<any[]>) => Promise<T>
): Promise<T> {
  if (isPostgres && pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");
      const txQuery = async (sql: string, params: any[] = []) => {
        const res = await client.query(sql, params);
        return res.rows.map(transformRow);
      };
      const result = await callback(txQuery);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } else if (sqliteDb) {
    try {
      sqliteDb.prepare("BEGIN IMMEDIATE").run();
      const txQuery = async (sql: string, params: any[] = []) => {
        const { sqliteSql, sqliteParams } = prepareSqliteQuery(sql, params);
        const stmt = sqliteDb.prepare(sqliteSql);
        let rows: any[];
        if (sqliteSql.trim().toUpperCase().startsWith("SELECT") || sqliteSql.includes("RETURNING")) {
          rows = stmt.all(...sqliteParams);
        } else {
          const info = stmt.run(...sqliteParams);
          rows = info.changes ? [{ id: info.lastInsertRowid }] : [];
        }
        return rows.map(transformRow);
      };
      const result = await callback(txQuery);
      sqliteDb.prepare("COMMIT").run();
      return result;
    } catch (err) {
      try {
        sqliteDb.prepare("ROLLBACK").run();
      } catch (rErr) {
        // Ignored if rollback fails
      }
      throw err;
    }
  }
  throw new Error("No database connection available");
}

export async function initDb() {
  const createTablesSql = isPostgres
    ? `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'SALES',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        business_name VARCHAR(255) NOT NULL,
        gst_number VARCHAR(50),
        customer_type VARCHAR(50) NOT NULL DEFAULT 'RETAIL',
        address TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'LEAD',
        follow_up_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        current_stock INT NOT NULL DEFAULT 0,
        minimum_stock INT NOT NULL DEFAULT 0,
        warehouse_location VARCHAR(255) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity_changed INT NOT NULL,
        movement_type VARCHAR(10) NOT NULL,
        reason TEXT NOT NULL,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_challans (
        id SERIAL PRIMARY KEY,
        challan_number VARCHAR(100) UNIQUE NOT NULL,
        customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        total_quantity INT NOT NULL DEFAULT 0,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS challan_items (
        id SERIAL PRIMARY KEY,
        challan_id INT NOT NULL REFERENCES sales_challans(id) ON DELETE CASCADE,
        product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name VARCHAR(255) NOT NULL,
        product_sku VARCHAR(100) NOT NULL,
        unit_price NUMERIC(12,2) NOT NULL,
        quantity INT NOT NULL,
        total_price NUMERIC(12,2) NOT NULL
      );
    `
    : `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'SALES',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        business_name TEXT NOT NULL,
        gst_number TEXT,
        customer_type TEXT NOT NULL DEFAULT 'RETAIL',
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'LEAD',
        follow_up_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        unit_price REAL NOT NULL,
        current_stock INTEGER NOT NULL DEFAULT 0,
        minimum_stock INTEGER NOT NULL DEFAULT 0,
        warehouse_location TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity_changed INTEGER NOT NULL,
        movement_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_challans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challan_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        total_quantity INTEGER NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS challan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challan_id INTEGER NOT NULL REFERENCES sales_challans(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        product_name TEXT NOT NULL,
        product_sku TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        total_price REAL NOT NULL
      );
    `;

  if (isPostgres && pgPool) {
    await pgPool.query(createTablesSql);
  } else if (sqliteDb) {
    sqliteDb.exec(createTablesSql);
  }
  console.log("[DB Engine] Schema initialized successfully.");
}
