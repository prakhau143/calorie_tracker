import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Food } from '../src/models/food.js';
import { Activity } from '../src/models/activity.js';
import { calculateBmr } from '../src/services/bmr.service.js';
import { calculateFoodCalories, calculateActivityCalories } from '../src/services/calorie.service.js';

const TEST_MONGO_URI = 'mongodb://localhost:27017/net-calorie-tracker-test';
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
