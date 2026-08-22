import { Router } from 'express';
import { validate } from '../validators/validate.js';
import { dayParamsSchema, dailyLogSaveSchema } from '../validators/dailyLog.validator.js';
import { getDay, saveDay } from '../controllers/dailyLogs.controller.js';

export const dailyLogsRouter = Router({ mergeParams: true });

dailyLogsRouter.get('/:date', validate(dayParamsSchema, 'params'), getDay);
dailyLogsRouter.put(
  '/:date',
  validate(dayParamsSchema, 'params'),
  validate(dailyLogSaveSchema),
  saveDay,
);
