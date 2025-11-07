import { z } from "zod";

export const purchaseSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const adjustDiamondsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.number().int("Amount must be an integer"),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type AdjustDiamondsInput = z.infer<typeof adjustDiamondsSchema>;
