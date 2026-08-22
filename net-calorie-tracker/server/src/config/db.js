import mongoose from 'mongoose';
import { env } from './env.js';
import * as models from '../models/index.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
  return mongoose.connection;
}
