import mongoose from 'mongoose';

const foodEntrySchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    foodNameSnapshot: { type: String, required: true },
    meal: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
    servingDescriptionSnapshot: { type: String },
    quantityGrams: { type: Number, required: true, min: 0.01 },
    caloriesPer100gSnapshot: { type: Number, required: true },
    calories: { type: Number, required: true },
  },
  { _id: false },
);

const activityEntrySchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
    activityNameSnapshot: { type: String, required: true },
    specificMotionSnapshot: { type: String, required: true },
    metValueSnapshot: { type: Number, required: true },
    durationMinutes: { type: Number, required: true, min: 0.01 },
    caloriesBurned: { type: Number, required: true },
  },
  { _id: false },
);

const dailyLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    foodEntries: { type: [foodEntrySchema], default: [] },
    activityEntries: { type: [activityEntrySchema], default: [] },
    bmr: { type: Number, required: true },
    foodCalories: { type: Number, required: true },
    activityCalories: { type: Number, required: true },
    netCalories: { type: Number, required: true },
  },
  { timestamps: true },
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
