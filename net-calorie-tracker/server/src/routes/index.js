import { Router } from 'express';
import { ok } from '../utils/response.js';
import { usersRouter } from './users.routes.js';
import { foodsRouter } from './foods.routes.js';
import { activitiesRouter } from './activities.routes.js';
import { dailyLogsRouter } from './dailyLogs.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (req, res) => {
  ok(res, { status: 'ok' });
});

apiRouter.use('/users/:userId/days', dailyLogsRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/foods', foodsRouter);
apiRouter.use('/activities', activitiesRouter);
