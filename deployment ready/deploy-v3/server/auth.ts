import { type Request, type Response, type NextFunction } from "express";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

// Extend Express Session types
declare module "express-session" {
  interface SessionData {
    adminId?: string;
    isAdmin?: boolean;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
