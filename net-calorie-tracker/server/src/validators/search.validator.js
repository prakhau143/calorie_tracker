import { z } from 'zod';

export const searchQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

export const idParamSchema = (paramName) =>
  z.object({
    [paramName]: z.string().regex(/^[a-f0-9]{24}$/i, `invalid ${paramName}`),
  });
