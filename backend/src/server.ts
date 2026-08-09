import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import productRoutes from "./routes/product.routes";
import customerRoutes from "./routes/customer.routes";
import stockMovementRoutes from "./routes/stockMovement.routes";
import challanRoutes from "./routes/challan.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { initDb } from "./lib/db";
import { autoSeed } from "./seed";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & body parsers
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "ERP + CRM REST API Service is active",
    timestamp: new Date(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `API endpoint '${req.method} ${req.url}' not found` });
});

// Initialize DB schema, auto-seed defaults, and start server
initDb()
  .then(async () => {
    await autoSeed();
    app.listen(PORT, () => {
      console.log(`ERP CRM Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });