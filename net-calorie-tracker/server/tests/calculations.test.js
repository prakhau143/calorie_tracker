import { describe, it, expect } from 'vitest';
import { calculateBmr } from '../src/services/bmr.service.js';
import {
  calculateFoodCalories,
  calculateActivityCalories,
  calculateNetCalories,
  sumRounded,
} from '../src/services/calorie.service.js';

describe('calculateBmr', () => {
  it('computes the male BMR from the brief worked example', () => {
    expect(calculateBmr({ sex: 'male', weightKg: 72, heightCm: 178, age: 25 })).toBe(1778.3);
  });

  it('computes the female BMR branch', () => {
    // 655.0955 + 9.5634*60 + 1.8496*165 - 4.6756*30 = 1393.8155
    expect(calculateBmr({ sex: 'female', weightKg: 60, heightCm: 165, age: 30 })).toBeCloseTo(
      1393.8155,
      2,
    );
  });

  it('rejects non-positive inputs', () => {
    expect(() => calculateBmr({ sex: 'male', weightKg: 0, heightCm: 178, age: 25 })).toThrow();
    expect(() => calculateBmr({ sex: 'male', weightKg: 72, heightCm: -1, age: 25 })).toThrow();
    expect(() => calculateBmr({ sex: 'male', weightKg: 72, heightCm: 178, age: 0 })).toThrow();
  });
});

describe('calculateFoodCalories', () => {
  it('computes calories at 100g (identity)', () => {
    expect(calculateFoodCalories({ caloriesPer100g: 130, quantityGrams: 100 })).toBe(130);
  });

  it('computes calories at 150g per the brief example (130 -> 195)', () => {
    expect(calculateFoodCalories({ caloriesPer100g: 130, quantityGrams: 150 })).toBe(195);
  });

  it('computes calories for decimal gram quantities', () => {
    expect(calculateFoodCalories({ caloriesPer100g: 87, quantityGrams: 33.5 })).toBeCloseTo(
      29.145,
      2,
    );
  });

  it('rejects zero and negative grams', () => {
    expect(() => calculateFoodCalories({ caloriesPer100g: 130, quantityGrams: 0 })).toThrow();
    expect(() => calculateFoodCalories({ caloriesPer100g: 130, quantityGrams: -5 })).toThrow();
  });
});

describe('calculateActivityCalories', () => {
  it('computes calories burned for the brief worked example (MET 8.5, 45 min)', () => {
    expect(
      calculateActivityCalories({ metValue: 8.5, weightKg: 72, durationMinutes: 45 }),
    ).toBe(459);
  });

  it('supports decimal MET values', () => {
    expect(
      calculateActivityCalories({ metValue: 4.5, weightKg: 60, durationMinutes: 30 }),
    ).toBe(135);
  });

  it('rejects zero and negative durations', () => {
    expect(() =>
      calculateActivityCalories({ metValue: 8.5, weightKg: 72, durationMinutes: 0 }),
    ).toThrow();
    expect(() =>
      calculateActivityCalories({ metValue: 8.5, weightKg: 72, durationMinutes: -10 }),
    ).toThrow();
  });
});

describe('sumRounded + calculateNetCalories', () => {
  it('sums already-rounded entries so rows add up to the displayed total', () => {
    const entries = [{ calories: 195 }, { calories: 29.15 }];
    expect(sumRounded(entries, 'calories')).toBe(224.15);
  });

  it('derives net calories from rounded totals per the brief worked example', () => {
    const bmr = calculateBmr({ sex: 'male', weightKg: 72, heightCm: 178, age: 25 });
    const activityCalories = calculateActivityCalories({
      metValue: 8.5,
      weightKg: 72,
      durationMinutes: 45,
    });
    const foodCalories = 195;
    expect(calculateNetCalories({ foodCalories, bmr, activityCalories })).toBeCloseTo(
      195 - 1778.3 - 459,
      2,
    );
  });
});
