// Mirrors server/src/services/{bmr,calorie}.service.js exactly, so the preview
// shown before "Add"/"Save Day" always matches what the backend persists.

export function round2(value) {
  return Math.round(value * 100) / 100;
}

export function calculateBmr({ sex, weightKg, heightCm, age }) {
  const bmr =
    sex === 'male'
      ? 66.473 + 13.7516 * weightKg + 5.0033 * heightCm - 6.755 * age
      : 655.0955 + 9.5634 * weightKg + 1.8496 * heightCm - 4.6756 * age;
  return round2(bmr);
}

export function calculateFoodCalories({ caloriesPer100g, quantityGrams }) {
  if (!(quantityGrams > 0)) return 0;
  return round2((caloriesPer100g * quantityGrams) / 100);
}

export function calculateActivityCalories({ metValue, weightKg, durationMinutes }) {
  if (!(durationMinutes > 0)) return 0;
  return round2(metValue * weightKg * (durationMinutes / 60));
}

export function sumRounded(entries, key) {
  return round2(entries.reduce((sum, entry) => sum + entry[key], 0));
}
