import { z } from "zod";

export const orderItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
});

export const orderSchema = z.object({
    totalAmount: z.number().nonnegative(),
    items: z.array(orderItemSchema).min(1),
});

export type OrderSchema = z.infer<typeof orderSchema>;
