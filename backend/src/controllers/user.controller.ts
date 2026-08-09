import { Request, Response } from "express";

import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../services/user.service";

// CREATE USER
export async function createUserController(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    const user = await createUser(
      name,
      email,
      password,
      role
    );

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    console.error("Create user error:", error);

    return res.status(400).json({
      message: error.message || "Failed to create user",
    });
  }
}

// GET ALL USERS
export async function getUsersController(
  req: Request,
  res: Response
) {
  try {
    const users = await getUsers();

    return res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error: any) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch users",
    });
  }
}

// GET USER BY ID
export async function getUserController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error: any) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: error.message || "Failed to fetch user",
    });
  }
}

// UPDATE USER
export async function updateUserController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const { name, email, password, role } = req.body;

    if (
      name === undefined &&
      email === undefined &&
      password === undefined &&
      role === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    const user = await updateUser(id, {
      name,
      email,
      password,
      role,
    });

    return res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    console.error("Update user error:", error);

    return res.status(400).json({
      message: error.message || "Failed to update user",
    });
  }
}

// DELETE USER
export async function deleteUserController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const existingUser = await getUserById(id);

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = await deleteUser(id);

    return res.status(200).json({
      message: "User deleted successfully",
      user,
    });
  } catch (error: any) {
    console.error("Delete user error:", error);

    return res.status(400).json({
      message: error.message || "Failed to delete user",
    });
  }
}