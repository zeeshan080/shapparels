import { z } from "zod";

export const checkoutFormSchema = z.object({
  customerName: z.string().min(1, "Name is required").max(100),
  customerPhone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15)
    .regex(/^[0-9+\-\s]+$/, "Invalid phone number format"),
  customerEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  shippingAddress: z.string().min(5, "Please enter your full address").max(500),
  shippingCity: z.string().min(1, "City is required").max(100),
  shippingState: z.string().max(100).optional(),
  shippingZipCode: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});

export type CheckoutForm = z.infer<typeof checkoutFormSchema>;
