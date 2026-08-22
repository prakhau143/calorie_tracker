import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  age: z.coerce.number().int().positive(),
  weightKg: z.coerce.number().positive(),
  heightCm: z.coerce.number().positive(),
  sex: z.enum(['male', 'female']),
});

export const userUpdateSchema = userSchema.partial();

export const userIdParamsSchema = z.object({
  userId: z.string().regex(/^[a-f0-9]{24}$/i, 'invalid userId'),
});
