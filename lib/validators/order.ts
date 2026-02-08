import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string(),
  productSlug: z.string(),
  productImage: z.string().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  variantLabel: z.string().nullable().optional(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  total: z.number().positive(),
});

export const orderCreateSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  customerPhone: z.string().min(10, "Valid phone number is required"),
  shippingAddress: z.string().min(1, "Address is required"),
  shippingCity: z.string().min(1, "City is required"),
  shippingState: z.string().optional(),
  shippingZipCode: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export type OrderCreate = z.infer<typeof orderCreateSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatusUpdate = z.infer<typeof orderStatusUpdateSchema>;
