import { Request, Response } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service";

export async function createProductController(req: Request, res: Response) {
  try {
    const {
      name,
      sku,
      category,
      unitPrice,
      currentStock,
      minimumStock,
      warehouseLocation,
    } = req.body;

    if (
      !name ||
      !sku ||
      !category ||
      unitPrice === undefined ||
      currentStock === undefined ||
      minimumStock === undefined ||
      !warehouseLocation
    ) {
      return res.status(400).json({
        message: "Name, SKU, category, unit price, current stock, minimum stock, and warehouse location are required",
      });
    }

    const price = Number(unitPrice);
    const stock = Number(currentStock);
    const minStock = Number(minimumStock);

    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Unit price must be a non-negative number" });
    }

    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      return res.status(400).json({ message: "Current stock must be a non-negative integer" });
    }

    if (isNaN(minStock) || minStock < 0 || !Number.isInteger(minStock)) {
      return res.status(400).json({ message: "Minimum stock must be a non-negative integer" });
    }

    const product = await createProduct({
      name,
      sku,
      category,
      unitPrice: price,
      currentStock: stock,
      minimumStock: minStock,
      warehouseLocation,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    console.error("Create product error:", error);
    return res.status(400).json({
      message: error.message || "Failed to create product",
    });
  }
}

export async function getProductsController(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const search = req.query.search ? String(req.query.search) : undefined;
    const category = req.query.category ? String(req.query.category) : undefined;
    const lowStock = req.query.lowStock === "true" || req.query.lowStock === "1";

    const data = await getProducts({
      page,
      limit,
      search,
      category,
      lowStock,
    });

    return res.status(200).json({
      message: "Products fetched successfully",
      ...data,
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch products",
    });
  }
}

export async function getProductController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      product,
    });
  } catch (error: any) {
    console.error("Get product error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch product",
    });
  }
}

export async function updateProductController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      name,
      sku,
      category,
      unitPrice,
      currentStock,
      minimumStock,
      warehouseLocation,
    } = req.body;

    const price = unitPrice !== undefined ? Number(unitPrice) : undefined;
    const stock = currentStock !== undefined ? Number(currentStock) : undefined;
    const minStock = minimumStock !== undefined ? Number(minimumStock) : undefined;

    if (price !== undefined && (isNaN(price) || price < 0)) {
      return res.status(400).json({ message: "Unit price must be a non-negative number" });
    }

    if (stock !== undefined && (isNaN(stock) || stock < 0 || !Number.isInteger(stock))) {
      return res.status(400).json({ message: "Current stock must be a non-negative integer" });
    }

    if (minStock !== undefined && (isNaN(minStock) || minStock < 0 || !Number.isInteger(minStock))) {
      return res.status(400).json({ message: "Minimum stock must be a non-negative integer" });
    }

    const product = await updateProduct(id, {
      name,
      sku,
      category,
      unitPrice: price,
      currentStock: stock,
      minimumStock: minStock,
      warehouseLocation,
    });

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    console.error("Update product error:", error);
    return res.status(400).json({
      message: error.message || "Failed to update product",
    });
  }
}

export async function deleteProductController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await deleteProduct(id);

    return res.status(200).json({
      message: "Product deleted successfully",
      product,
    });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return res.status(400).json({
      message: error.message || "Failed to delete product",
    });
  }
}