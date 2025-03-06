import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .refine(val => !val.includes('forbidden'), {
      message: 'Title contains forbidden word'
    }),
  description: z.string()
    .max(500, 'Description must be less than 500 characters'),
  price: z.number()
    .positive('Price must be greater than 0')
    .max(10000, 'Price must be less than 10000')
    .transform(val => Number(val.toFixed(2))),
  count: z.number()
    .int('Count must be an integer')
    .min(0, 'Count cannot be negative')
    .default(0)
});

export interface CreateProductDto extends z.infer<typeof createProductSchema> {}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface StockProduct extends Product {
  count: number;
}

