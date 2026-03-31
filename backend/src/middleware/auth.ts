import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export interface AuthPayload {
  userId: string;
  role: string;
}

// Augment Request with a custom property — avoids collision with passport's req.user
declare module "express-serve-static-core" {
  interface Request {
    authPayload?: AuthPayload;
  }
}

// AuthRequest kept as a type alias so existing imports don't break
export type AuthRequest = Request;

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.authPayload = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authPayload) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.authPayload.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
