import mongoose from 'mongoose';
import { MONGODB_URI } from '../config.js';

let connected = false;

export async function connectDB(): Promise<void> {
  if (connected || !MONGODB_URI) return;
  const isAtlas = MONGODB_URI.includes('mongodb+srv') || MONGODB_URI.includes('mongodb.net');
  await mongoose.connect(MONGODB_URI, isAtlas ? { tls: true, tlsAllowInvalidCertificates: true } : {});
  connected = true;
  console.log('[db] MongoDB connected');
}
