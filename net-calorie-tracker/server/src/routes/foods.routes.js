import { Router } from 'express';
import { validate } from '../validators/validate.js';
import { searchQuerySchema, idParamSchema } from '../validators/search.validator.js';
import { searchFoods, getFood } from '../controllers/foods.controller.js';

export const foodsRouter = Router();

foodsRouter.get('/', validate(searchQuerySchema, 'query'), searchFoods);
foodsRouter.get('/:foodId', validate(idParamSchema('foodId'), 'params'), getFood);
