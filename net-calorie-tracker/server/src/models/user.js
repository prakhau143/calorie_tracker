import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1 },
    weightKg: { type: Number, required: true, min: 1 },
    heightCm: { type: Number, required: true, min: 1 },
    sex: { type: String, required: true, enum: ['male', 'female'] },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
