import bcrypt from "bcrypt";
import { initDb, query, queryOne } from "./lib/db";

export async function seed() {
  console.log("[Seeding] Initializing database schema...");
  await initDb();

  console.log("[Seeding] Database seeding started...");

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  const users = [
    { name: "System Admin", email: "admin@erp.com", password: defaultPassword, role: "ADMIN" },
    { name: "Sales Exec", email: "sales@erp.com", password: defaultPassword, role: "SALES" },
    { name: "Warehouse Manager", email: "warehouse@erp.com", password: defaultPassword, role: "WAREHOUSE" },
    { name: "Accounts Lead", email: "accounts@erp.com", password: defaultPassword, role: "ACCOUNTS" },
  ];

  for (const u of users) {
    const existing = await queryOne(`SELECT id FROM users WHERE email = $1`, [u.email]);
    if (!existing) {
      await query(`INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`, [
        u.name,
        u.email,
        u.password,
        u.role,
      ]);
    }
  }
  console.log("[Seeding] Core role users verified.");

  const customers = [
    {
      name: "Acme Enterprises",
      mobile: "+91-9876543210",
      email: "procurement@acme.com",
      businessName: "Acme Global Solutions Pvt Ltd",
      gstNumber: "27AAACA12341Z1",
      customerType: "WHOLESALE",
      address: "101 Industrial Estate, Mumbai, MH",
      status: "ACTIVE",
      notes: "VIP wholesale client, Net 30 payment terms",
    },
    {
      name: "TechPulse Retail",
      mobile: "+91-9123456789",
      email: "contact@techpulse.in",
      businessName: "TechPulse Retailers",
      gstNumber: "29BBBCB56781Z2",
      customerType: "RETAIL",
      address: "42 MG Road, Bengaluru, KA",
      status: "ACTIVE",
      notes: "Frequent buyer of electronics",
    },
    {
      name: "Apex Logistics",
      mobile: "+91-9988776655",
      email: "info@apexdistributors.com",
      businessName: "Apex Distribution Hub",
      gstNumber: "07CCCCA99991Z3",
      customerType: "DISTRIBUTOR",
      address: "Plot 88 Logistics Park, Delhi",
      status: "LEAD",
      followUpDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      notes: "Follow up regarding regional dealership contract",
    },
  ];

  for (const c of customers) {
    const existing = await queryOne(`SELECT id FROM customers WHERE email = $1`, [c.email]);
    if (!existing) {
      await query(
        `INSERT INTO customers (name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [c.name, c.mobile, c.email, c.businessName, c.gstNumber, c.customerType, c.address, c.status, c.followUpDate || null, c.notes]
      );
    }
  }
  console.log("[Seeding] Customers verified.");

  const products = [
    {
      name: "Wireless Ergonomic Mouse",
      sku: "PROD-MSE-001",
      category: "Peripherals",
      unitPrice: 1499.0,
      currentStock: 150,
      minimumStock: 20,
      warehouseLocation: "Rack A-12",
    },
    {
      name: "Mechanical RGB Keyboard",
      sku: "PROD-KBD-002",
      category: "Peripherals",
      unitPrice: 3999.0,
      currentStock: 45,
      minimumStock: 10,
      warehouseLocation: "Rack A-14",
    },
    {
      name: "27-inch 4K Monitor",
      sku: "PROD-MON-003",
      category: "Displays",
      unitPrice: 24999.0,
      currentStock: 8,
      minimumStock: 10,
      warehouseLocation: "Rack B-04",
    },
    {
      name: "USB-C Docking Station",
      sku: "PROD-DOC-004",
      category: "Accessories",
      unitPrice: 5999.0,
      currentStock: 30,
      minimumStock: 5,
      warehouseLocation: "Rack C-01",
    },
  ];

  for (const p of products) {
    const existing = await queryOne(`SELECT id FROM products WHERE sku = $1`, [p.sku]);
    if (!existing) {
      await query(
        `INSERT INTO products (name, sku, category, unit_price, current_stock, minimum_stock, warehouse_location) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [p.name, p.sku, p.category, p.unitPrice, p.currentStock, p.minimumStock, p.warehouseLocation]
      );
    }
  }
  console.log("[Seeding] Products verified.");
  console.log("[Seeding] Database seeding finished successfully.");
}

export async function autoSeed() {
  try {
    const anyUser = await queryOne(`SELECT id FROM users LIMIT 1`);
    if (!anyUser) {
      console.log("[AutoSeed] Database is empty. Seeding initial database records...");
      await seed();
    }
  } catch (err) {
    console.error("[AutoSeed Error]", err);
  }
}

if (require.main === module) {
  seed().catch((e) => {
    console.error("[Seeding Error]", e);
    process.exit(1);
  });
}


