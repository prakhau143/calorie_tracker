import { Router } from 'express';
import { validate } from '../validators/validate.js';
import { searchQuerySchema, idParamSchema } from '../validators/search.validator.js';
import { searchActivities, getActivity } from '../controllers/activities.controller.js';

export const activitiesRouter = Router();

activitiesRouter.get('/', validate(searchQuerySchema, 'query'), searchActivities);
activitiesRouter.get(
  '/:activityId',
  validate(idParamSchema('activityId'), 'params'),
  getActivity,
);
