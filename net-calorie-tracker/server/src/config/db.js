import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Some local/VPN networks hand Node a resolver that fails SRV lookups
// (mongodb+srv://) even though A/AAAA records work fine. Point at public
// resolvers so the Atlas SRV/TXT lookup succeeds everywhere.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let connectionPromise = null;

export function connectDB() {
  if (!connectionPromise) {
    mongoose.set('strictQuery', true);
    connectionPromise = mongoose.connect(env.mongoUri).then((m) => m.connection);
  }
  return connectionPromise;
}
