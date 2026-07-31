import { z } from "zod";
export const checkoutSchema = z.object({
  fullName: z.string().min(3, "Enter the recipient’s full name"),
  email: z.email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^(\+92|0)?3\d{9}$/, "Enter a valid Pakistani mobile number"),
  province: z.string().min(2, "Select a province"),
  city: z.string().min(2, "Enter a city"),
  area: z.string().min(2, "Enter an area"),
  address: z.string().min(10, "Enter the complete delivery address"),
  postalCode: z.string().optional(),
  payment: z.enum(["cod", "bank"]),
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
  idempotencyKey: z.string().uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
