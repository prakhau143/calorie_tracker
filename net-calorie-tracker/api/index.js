import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

await connectDB();

export default createApp();
