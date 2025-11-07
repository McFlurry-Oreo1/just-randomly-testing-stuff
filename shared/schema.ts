import { z } from "zod";

// User types
export interface User {
  id: string;
  email: string;
  password: string; // hashed password
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  diamondBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UpsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  createdAt: Date;
}

export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  imageUrl: z.string().optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;

// Order types
export interface Order {
  id: string;
  userId: string;
  productId: string;
  status: string; // pending, completed
  createdAt: Date;
  completedAt?: Date;
}

export const insertOrderSchema = z.object({
  userId: z.string(),
  productId: z.string(),
  status: z.string().default("pending"),
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
