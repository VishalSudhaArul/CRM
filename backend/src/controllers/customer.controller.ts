import { Request, Response } from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addFollowUpNote,
  deleteCustomer,
} from "../services/customer.service";

export async function createCustomerController(req: Request, res: Response) {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (!name || !mobile || !email || !businessName || !customerType || !address) {
      return res.status(400).json({
        message: "Name, mobile, email, business name, customer type, and address are required",
      });
    }

    if (!["RETAIL", "WHOLESALE", "DISTRIBUTOR"].includes(customerType)) {
      return res.status(400).json({
        message: "Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR",
      });
    }

    if (status && !["LEAD", "ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message: "Status must be LEAD, ACTIVE, or INACTIVE",
      });
    }

    const customer = await createCustomer({
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      notes,
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error: any) {
    console.error("Create customer error:", error);
    return res.status(400).json({
      message: error.message || "Failed to create customer",
    });
  }
}

export async function getCustomersController(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const search = req.query.search ? String(req.query.search) : undefined;
    const customerType = req.query.customerType as any;
    const status = req.query.status as any;

    const data = await getCustomers({
      page,
      limit,
      search,
      customerType,
      status,
    });

    return res.status(200).json({
      message: "Customers fetched successfully",
      ...data,
    });
  } catch (error: any) {
    console.error("Get customers error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch customers",
    });
  }
}

export async function getCustomerController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    return res.status(200).json({
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error: any) {
    console.error("Get customer error:", error);
    return res.status(500).json({
      message: error.message || "Failed to fetch customer",
    });
  }
}

export async function updateCustomerController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate,
      notes,
    } = req.body;

    if (customerType && !["RETAIL", "WHOLESALE", "DISTRIBUTOR"].includes(customerType)) {
      return res.status(400).json({
        message: "Customer type must be RETAIL, WHOLESALE, or DISTRIBUTOR",
      });
    }

    if (status && !["LEAD", "ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message: "Status must be LEAD, ACTIVE, or INACTIVE",
      });
    }

    const customer = await updateCustomer(id, {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      notes,
    });

    return res.status(200).json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error: any) {
    console.error("Update customer error:", error);
    return res.status(400).json({
      message: error.message || "Failed to update customer",
    });
  }
}

export async function addFollowUpNoteController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const { notes, followUpDate } = req.body;
    if (!notes) {
      return res.status(400).json({ message: "Notes content is required" });
    }

    const customer = await addFollowUpNote(
      id,
      notes,
      followUpDate ? new Date(followUpDate) : undefined
    );

    return res.status(200).json({
      message: "Follow-up note added successfully",
      customer,
    });
  } catch (error: any) {
    console.error("Add follow-up note error:", error);
    return res.status(400).json({
      message: error.message || "Failed to add follow-up note",
    });
  }
}

export async function deleteCustomerController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }

    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const customer = await deleteCustomer(id);

    return res.status(200).json({
      message: "Customer deleted successfully",
      customer,
    });
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return res.status(400).json({
      message: error.message || "Failed to delete customer",
    });
  }
}