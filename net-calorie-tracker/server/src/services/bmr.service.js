export function calculateBmr({ sex, weightKg, heightCm, age }) {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) {
    throw new Error('weightKg, heightCm, and age must be positive');
  }

  const bmr =
    sex === 'male'
      ? 66.473 + 13.7516 * weightKg + 5.0033 * heightCm - 6.755 * age
      : 655.0955 + 9.5634 * weightKg + 1.8496 * heightCm - 4.6756 * age;

  return round2(bmr);
}

export function round2(value) {
  return Math.round(value * 100) / 100;
}
