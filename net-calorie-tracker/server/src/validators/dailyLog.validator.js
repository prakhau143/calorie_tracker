import { z } from 'zod';
import { isWithinAllowedWindow } from '../utils/date.js';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'invalid id');

export const dayParamsSchema = z.object({
  userId: objectId,
  date: z.string().refine(isWithinAllowedWindow, {
    message: 'date must be a real calendar date within today and the previous 30 days',
  }),
});

export const foodEntryInputSchema = z.object({
  foodId: objectId,
  meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  quantityGrams: z.coerce.number().positive(),
});

export const activityEntryInputSchema = z.object({
  activityId: objectId,
  durationMinutes: z.coerce.number().positive(),
});

export const dailyLogSaveSchema = z.object({
  foodEntries: z.array(foodEntryInputSchema).default([]),
  activityEntries: z.array(activityEntryInputSchema).default([]),
});
