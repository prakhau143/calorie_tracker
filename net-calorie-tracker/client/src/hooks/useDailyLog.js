import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { calculateActivityCalories, calculateBmr, calculateFoodCalories, sumRounded } from '../services/calc.js';

function mapFoodEntryFromLog(entry) {
  return {
    foodId: entry.foodId,
    foodName: entry.foodNameSnapshot,
    servingDescription: entry.servingDescriptionSnapshot,
    meal: entry.meal,
    quantityGrams: entry.quantityGrams,
    caloriesPer100g: entry.caloriesPer100gSnapshot,
    calories: entry.calories,
  };
}

function mapActivityEntryFromLog(entry) {
  return {
    activityId: entry.activityId,
    activityName: entry.activityNameSnapshot,
    specificMotion: entry.specificMotionSnapshot,
    metValue: entry.metValueSnapshot,
    durationMinutes: entry.durationMinutes,
    caloriesBurned: entry.caloriesBurned,
  };
}

export function useDailyLog(userId, date, user) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const [foodEntries, setFoodEntries] = useState([]);
  const [activityEntries, setActivityEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  useEffect(() => {
    if (!userId || !date) return;
    let cancelled = false;

    setStatus('loading');
    setError(null);
    setSaveError(null);
    setLastSavedAt(null);

    api
      .getDay(userId, date)
      .then((dailyLog) => {
        if (cancelled) return;
        setFoodEntries(dailyLog ? dailyLog.foodEntries.map(mapFoodEntryFromLog) : []);
        setActivityEntries(dailyLog ? dailyLog.activityEntries.map(mapActivityEntryFromLog) : []);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [userId, date]);

  const addFoodEntry = useCallback((food, meal, quantityGrams) => {
    const calories = calculateFoodCalories({ caloriesPer100g: food.caloriesPer100g, quantityGrams });
    setFoodEntries((prev) => [
      ...prev,
      {
        foodId: food._id,
        foodName: food.name,
        servingDescription: food.servingDescription,
        meal,
        quantityGrams,
        caloriesPer100g: food.caloriesPer100g,
        calories,
      },
    ]);
  }, []);

  const removeFoodEntry = useCallback((index) => {
    setFoodEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addActivityEntry = useCallback(
    (activity, durationMinutes) => {
      const caloriesBurned = calculateActivityCalories({
        metValue: activity.metValue,
        weightKg: user.weightKg,
        durationMinutes,
      });
      setActivityEntries((prev) => [
        ...prev,
        {
          activityId: activity._id,
          activityName: activity.activityName,
          specificMotion: activity.specificMotion,
          metValue: activity.metValue,
          durationMinutes,
          caloriesBurned,
        },
      ]);
    },
    [user],
  );

  const removeActivityEntry = useCallback((index) => {
    setActivityEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const bmr = useMemo(
    () => calculateBmr({ sex: user.sex, weightKg: user.weightKg, heightCm: user.heightCm, age: user.age }),
    [user],
  );
  const foodCalories = useMemo(() => sumRounded(foodEntries, 'calories'), [foodEntries]);
  const activityCalories = useMemo(
    () => sumRounded(activityEntries, 'caloriesBurned'),
    [activityEntries],
  );
  const netCalories = useMemo(
    () => Math.round((foodCalories - bmr - activityCalories) * 100) / 100,
    [foodCalories, bmr, activityCalories],
  );

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const dailyLog = await api.saveDay(userId, date, {
        foodEntries: foodEntries.map((e) => ({
          foodId: e.foodId,
          meal: e.meal,
          quantityGrams: e.quantityGrams,
        })),
        activityEntries: activityEntries.map((e) => ({
          activityId: e.activityId,
          durationMinutes: e.durationMinutes,
        })),
      });
      setFoodEntries(dailyLog.foodEntries.map(mapFoodEntryFromLog));
      setActivityEntries(dailyLog.activityEntries.map(mapActivityEntryFromLog));
      setLastSavedAt(new Date());
      return dailyLog;
    } catch (err) {
      setSaveError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, date, foodEntries, activityEntries]);

  return {
    status,
    error,
    foodEntries,
    activityEntries,
    addFoodEntry,
    removeFoodEntry,
    addActivityEntry,
    removeActivityEntry,
    bmr,
    foodCalories,
    activityCalories,
    netCalories,
    saving,
    saveError,
    lastSavedAt,
    save,
  };
}
