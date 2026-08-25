import { Food } from '../models/food.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, AppError } from '../utils/response.js';
import { prefixRegex } from '../utils/escapeRegex.js';

export const searchFoods = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const filter = search ? { name: prefixRegex(search) } : {};

  const [items, total] = await Promise.all([
    Food.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Food.countDocuments(filter),
  ]);

  ok(res, { items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.foodId);
  if (!food) throw new AppError('Food not found', 404, 'NOT_FOUND');
  ok(res, food);
});
