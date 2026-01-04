import { z } from "zod";

export const purchaseSchema = z.object({
  productId: z.string().min(1, "Product ID is required").optional(),
  productName: z.string().min(1, "Product name is required").optional(),
  price: z.number().positive("Price must be positive").optional(),
}).refine((data) => data.productId || (data.productName && data.price), {
  message: "Either productId or both productName and price are required",
});

export const adjustDiamondsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().int("Amount must be an integer"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type AdjustDiamondsInput = z.infer<typeof adjustDiamondsSchema>;
