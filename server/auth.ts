import type { Request, Response, NextFunction, Express } from "express";
import session from "express-session";
import { storage } from "./storage";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Session configuration
export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || 'diamond-store-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

// Setup authentication
export async function setupAuth(app: Express) {
  app.use(getSession());
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user is admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = (req.session as any).userId;
    const user = await storage.getUser(userId);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

// Helper to get current user from session
export async function getCurrentUser(req: Request) {
  if (!req.session || !(req.session as any).userId) {
    return null;
  }
  const userId = (req.session as any).userId;
  return await storage.getUser(userId);
}
