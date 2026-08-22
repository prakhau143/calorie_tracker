import { round2 } from './bmr.service.js';

export function calculateFoodCalories({ caloriesPer100g, quantityGrams }) {
  if (quantityGrams <= 0) {
    throw new Error('quantityGrams must be positive');
  }
  return round2((caloriesPer100g * quantityGrams) / 100);
}

export function calculateActivityCalories({ metValue, weightKg, durationMinutes }) {
  if (durationMinutes <= 0) {
    throw new Error('durationMinutes must be positive');
  }
  return round2(metValue * weightKg * (durationMinutes / 60));
}

export function sumRounded(entries, key) {
  return round2(entries.reduce((sum, entry) => sum + entry[key], 0));
}

export function calculateNetCalories({ foodCalories, bmr, activityCalories }) {
  return round2(foodCalories - bmr - activityCalories);
}
