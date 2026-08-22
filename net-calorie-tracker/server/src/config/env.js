import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: rootEnvPath });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(required('PORT', '4000')),
  mongoUri: required('MONGO_URI'),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  nodeEnv: required('NODE_ENV', 'development'),
};
