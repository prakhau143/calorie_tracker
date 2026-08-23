import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import * as models from '../src/models/index.js';

async function run() {
  await connectDB();
  await Promise.all(Object.values(models).map((model) => model.syncIndexes()));
  console.log('Indexes synced for:', Object.values(models).map((model) => model.modelName).join(', '));
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Index sync failed:', err);
  process.exit(1);
});
