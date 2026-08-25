import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Food } from '../src/models/food.js';
import { Activity } from '../src/models/activity.js';
import { calculateBmr } from '../src/services/bmr.service.js';
import { calculateFoodCalories, calculateActivityCalories } from '../src/services/calorie.service.js';

// Deliberately NOT MONGO_URI: these tests call dropDatabase(), and MONGO_URI
// points at Atlas in this project. Override via TEST_MONGO_URI if your local
// Mongo lives elsewhere; see the README for the Docker one-liner.
const TEST_MONGO_URI =
  process.env.TEST_MONGO_URI ?? 'mongodb://localhost:27017/net-calorie-tracker-test';
const app = createApp();

let seedFood;
let seedActivity;
let userId;

beforeAll(async () => {
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.dropDatabase();

  seedFood = await Food.create({
    sourceId: 'test-food-1',
    name: 'Test Chicken Breast',
    foodGroup: 'Poultry',
    caloriesPer100g: 200,
    servingDescription: '1 breast',
  });

  seedActivity = await Activity.create({
    sourceKey: 'test|running|8',
    activityName: 'test running',
    specificMotion: 'running',
    metValue: 8,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Users API', () => {
  it('creates a user and returns the success envelope', async () => {
    const res = await request(app).post('/api/users').send({
      name: 'Test User',
      age: 30,
      weightKg: 70,
      heightCm: 175,
      sex: 'male',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Test User');
    userId = res.body.data._id;
  });

  it('rejects an invalid sex with 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/users').send({
      name: 'Bad User',
      age: 30,
      weightKg: 70,
      heightCm: 175,
      sex: 'unspecified',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 NOT_FOUND for an unknown user', async () => {
    const res = await request(app).get('/api/users/aaaaaaaaaaaaaaaaaaaaaaaa');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Foods API', () => {
  it('returns a bounded page of results', async () => {
    const res = await request(app).get('/api/foods?limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    expect(res.body.data.limit).toBe(5);
  });
});

describe('Search prefix matching', () => {
  // "Special Salad" contains "al" (specI-AL) but must not surface for a
  // search of "al" — that substring-anywhere behavior is exactly the bug.
  beforeAll(async () => {
    await Food.create([
      { sourceId: 'search-almond', name: 'Almond Butter', foodGroup: 'Nuts', caloriesPer100g: 614 },
      { sourceId: 'search-albacore', name: 'Albacore Tuna', foodGroup: 'Seafood', caloriesPer100g: 184 },
      { sourceId: 'search-apple', name: 'Apple Pie', foodGroup: 'Desserts', caloriesPer100g: 237 },
      { sourceId: 'search-special-salad', name: 'Special Salad', foodGroup: 'Salads', caloriesPer100g: 120 },
      { sourceId: 'search-chicken-wrap', name: 'Chicken Wrap', foodGroup: 'Sandwiches', caloriesPer100g: 250 },
    ]);

    await Activity.create([
      { sourceKey: 'search|tennis|7', activityName: 'tennis', specificMotion: 'tennis, singles, competitive', metValue: 7 },
      // Neither field starts with "ten" even though activityName contains it
      // mid-word (In-TEN-se) — must not match a "ten" prefix search.
      {
        sourceKey: 'search|intense-cardio|9',
        activityName: 'intense cardio',
        specificMotion: 'high intensity interval training',
        metValue: 9,
      },
      // Only specificMotion starts with "ten" — confirms the $or across
      // both fields still works once each side is prefix-anchored.
      {
        sourceKey: 'search|racquet|6',
        activityName: 'racquet sports',
        specificMotion: 'tennis, doubles, social',
        metValue: 6,
      },
    ]);
  });

  it('matches only names starting with the search term, not substrings', async () => {
    const res = await request(app).get('/api/foods?search=al');

    expect(res.status).toBe(200);
    const names = res.body.data.items.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['Almond Butter', 'Albacore Tuna']));
    expect(names).not.toContain('Special Salad');
    expect(names).not.toContain('Apple Pie');
    for (const name of names) {
      expect(name.toLowerCase().startsWith('al')).toBe(true);
    }
  });

  it('narrows further as the prefix gets longer', async () => {
    const res = await request(app).get('/api/foods?search=alm');

    const names = res.body.data.items.map((f) => f.name);
    expect(names).toContain('Almond Butter');
    expect(names).not.toContain('Albacore Tuna');
  });

  it('matches a different prefix ("chic")', async () => {
    const res = await request(app).get('/api/foods?search=chic');

    const names = res.body.data.items.map((f) => f.name);
    expect(names).toContain('Chicken Wrap');
  });

  it('is case-insensitive', async () => {
    const [lower, upper] = await Promise.all([
      request(app).get('/api/foods?search=al'),
      request(app).get('/api/foods?search=AL'),
    ]);

    const lowerNames = lower.body.data.items.map((f) => f.name).sort();
    const upperNames = upper.body.data.items.map((f) => f.name).sort();
    expect(upperNames).toEqual(lowerNames);
  });

  it('trims leading/trailing whitespace before matching', async () => {
    const res = await request(app).get('/api/foods').query({ search: '  al  ' });

    const names = res.body.data.items.map((f) => f.name);
    expect(names).toContain('Almond Butter');
    expect(names).not.toContain('Special Salad');
  });

  it('does not change default (empty search) results', async () => {
    const withoutSearch = await request(app).get('/api/foods?limit=50');
    const withEmptySearch = await request(app).get('/api/foods?search=&limit=50');

    expect(withEmptySearch.body.data.total).toBe(withoutSearch.body.data.total);
  });

  it('safely escapes regex special characters instead of throwing or matching everything', async () => {
    const res = await request(app).get('/api/foods').query({ search: 'a.*+?^${}()|[]\\' });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  it('prefix-matches activities across both activityName and specificMotion', async () => {
    const res = await request(app).get('/api/activities?search=ten');

    expect(res.status).toBe(200);
    const items = res.body.data.items;
    const activityNames = items.map((a) => a.activityName);
    const motions = items.map((a) => a.specificMotion);

    expect(activityNames).toContain('tennis');
    // Matched via specificMotion ("tennis, doubles..."), not activityName.
    expect(activityNames).toContain('racquet sports');
    expect(motions.some((m) => m.startsWith('tennis'))).toBe(true);

    expect(activityNames).not.toContain('intense cardio');

    for (const item of items) {
      const nameMatches = item.activityName.toLowerCase().startsWith('ten');
      const motionMatches = item.specificMotion.toLowerCase().startsWith('ten');
      expect(nameMatches || motionMatches).toBe(true);
    }
  });
});

describe('Daily log API', () => {
  const date = '2026-08-20';

  it('computes BMR/food/activity/net and stores snapshots', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}/days/${date}`)
      .send({
        foodEntries: [{ foodId: seedFood._id.toString(), meal: 'breakfast', quantityGrams: 150 }],
        activityEntries: [{ activityId: seedActivity._id.toString(), durationMinutes: 30 }],
      });

    const expectedBmr = calculateBmr({ sex: 'male', weightKg: 70, heightCm: 175, age: 30 });
    const expectedFoodCalories = calculateFoodCalories({ caloriesPer100g: 200, quantityGrams: 150 });
    const expectedActivityCalories = calculateActivityCalories({ metValue: 8, weightKg: 70, durationMinutes: 30 });

    expect(res.status).toBe(200);
    const log = res.body.data;
    expect(log.bmr).toBe(expectedBmr);
    expect(log.foodCalories).toBe(expectedFoodCalories);
    expect(log.activityCalories).toBe(expectedActivityCalories);
    expect(log.netCalories).toBe(
      Math.round((expectedFoodCalories - expectedBmr - expectedActivityCalories) * 100) / 100,
    );
    expect(log.foodEntries[0].foodNameSnapshot).toBe('Test Chicken Breast');
    expect(log.activityEntries[0].activityNameSnapshot).toBe('test running');
  });

  it('updates rather than duplicates on re-PUT of the same date', async () => {
    await request(app)
      .put(`/api/users/${userId}/days/${date}`)
      .send({
        foodEntries: [{ foodId: seedFood._id.toString(), meal: 'lunch', quantityGrams: 100 }],
        activityEntries: [],
      });

    const res = await request(app).get(`/api/users/${userId}/days/${date}`);
    expect(res.status).toBe(200);
    expect(res.body.data.foodEntries).toHaveLength(1);
    expect(res.body.data.foodEntries[0].meal).toBe('lunch');

    const count = await mongoose.connection
      .collection('dailylogs')
      .countDocuments({ userId: new mongoose.Types.ObjectId(userId), date });
    expect(count).toBe(1);
  });
});
