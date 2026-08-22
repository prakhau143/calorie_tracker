import { User } from '../models/user.js';
import { Food } from '../models/food.js';
import { Activity } from '../models/activity.js';
import { DailyLog } from '../models/dailyLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, AppError } from '../utils/response.js';
import { calculateBmr } from '../services/bmr.service.js';
import {
  calculateFoodCalories,
  calculateActivityCalories,
  calculateNetCalories,
  sumRounded,
} from '../services/calorie.service.js';

export const getDay = asyncHandler(async (req, res) => {
  const { userId, date } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const dailyLog = await DailyLog.findOne({ userId, date });
  ok(res, dailyLog ?? null);
});

export const saveDay = asyncHandler(async (req, res) => {
  const { userId, date } = req.params;
  const { foodEntries, activityEntries } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const foodIds = [...new Set(foodEntries.map((e) => e.foodId))];
  const activityIds = [...new Set(activityEntries.map((e) => e.activityId))];

  const [foods, activities] = await Promise.all([
    foodIds.length ? Food.find({ _id: { $in: foodIds } }) : [],
    activityIds.length ? Activity.find({ _id: { $in: activityIds } }) : [],
  ]);

  const foodsById = new Map(foods.map((f) => [String(f._id), f]));
  const activitiesById = new Map(activities.map((a) => [String(a._id), a]));

  const unresolvedFoodIds = foodIds.filter((id) => !foodsById.has(id));
  if (unresolvedFoodIds.length) {
    throw new AppError(`Unknown foodId(s): ${unresolvedFoodIds.join(', ')}`, 400, 'INVALID_REFERENCE');
  }

  const unresolvedActivityIds = activityIds.filter((id) => !activitiesById.has(id));
  if (unresolvedActivityIds.length) {
    throw new AppError(
      `Unknown activityId(s): ${unresolvedActivityIds.join(', ')}`,
      400,
      'INVALID_REFERENCE',
    );
  }

  const resolvedFoodEntries = foodEntries.map((entry) => {
    const food = foodsById.get(entry.foodId);
    const calories = calculateFoodCalories({
      caloriesPer100g: food.caloriesPer100g,
      quantityGrams: entry.quantityGrams,
    });
    return {
      foodId: food._id,
      foodNameSnapshot: food.name,
      meal: entry.meal,
      servingDescriptionSnapshot: food.servingDescription,
      quantityGrams: entry.quantityGrams,
      caloriesPer100gSnapshot: food.caloriesPer100g,
      calories,
    };
  });

  const resolvedActivityEntries = activityEntries.map((entry) => {
    const activity = activitiesById.get(entry.activityId);
    const caloriesBurned = calculateActivityCalories({
      metValue: activity.metValue,
      weightKg: user.weightKg,
      durationMinutes: entry.durationMinutes,
    });
    return {
      activityId: activity._id,
      activityNameSnapshot: activity.activityName,
      specificMotionSnapshot: activity.specificMotion,
      metValueSnapshot: activity.metValue,
      durationMinutes: entry.durationMinutes,
      caloriesBurned,
    };
  });

  const bmr = calculateBmr({
    sex: user.sex,
    weightKg: user.weightKg,
    heightCm: user.heightCm,
    age: user.age,
  });
  const foodCalories = sumRounded(resolvedFoodEntries, 'calories');
  const activityCalories = sumRounded(resolvedActivityEntries, 'caloriesBurned');
  const netCalories = calculateNetCalories({ foodCalories, bmr, activityCalories });

  const dailyLog = await DailyLog.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        foodEntries: resolvedFoodEntries,
        activityEntries: resolvedActivityEntries,
        bmr,
        foodCalories,
        activityCalories,
        netCalories,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  ok(res, dailyLog);
});
