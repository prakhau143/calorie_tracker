import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    sourceKey: { type: String, required: true, unique: true },
    activityName: { type: String, required: true, trim: true },
    specificMotion: { type: String, required: true, trim: true },
    metValue: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

activitySchema.index({ activityName: 1 });

export const Activity = mongoose.model('Activity', activitySchema);
