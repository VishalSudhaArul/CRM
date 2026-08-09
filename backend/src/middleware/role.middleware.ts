import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        message: "Access denied. User not authenticated",
      });
    }

    // Check whether user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions",
      });
    }

    next();
  };
}

// Keep compatibility with product.routes.ts
export const roleMiddleware = requireRole;