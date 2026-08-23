import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise = null;

export function connectDB() {
  if (!connectionPromise) {
    mongoose.set('strictQuery', true);
    connectionPromise = mongoose.connect(env.mongoUri).then((m) => m.connection);
  }
  return connectionPromise;
}
