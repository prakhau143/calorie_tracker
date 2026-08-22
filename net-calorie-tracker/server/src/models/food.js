import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema(
  {
    sourceId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    foodGroup: { type: String, required: true, trim: true },
    caloriesPer100g: { type: Number, required: true, min: 0 },
    servingDescription: { type: String, trim: true },
    fatG: { type: Number },
    proteinG: { type: Number },
    carbohydrateG: { type: Number },
  },
  { timestamps: true },
);

foodSchema.index({ name: 1 });

export const Food = mongoose.model('Food', foodSchema);
