import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service";

export async function loginController(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser(email, password);

    return res.status(200).json({
      message: "Login successful",
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(401).json({
      message: error.message || "Invalid email or password",
    });
  }
}

export async function registerController(
  req: Request,
  res: Response
) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const result = await registerUser(name, email, password, role);

    return res.status(201).json({
      message: "User registered successfully",
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(400).json({
      message: error.message || "Failed to register user",
    });
  }
}