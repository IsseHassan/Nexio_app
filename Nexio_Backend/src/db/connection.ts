import mongoose from 'mongoose';
import { MONGODB_URI } from '../config.js';

let connected = false;

export async function connectDB(): Promise<void> {
  if (connected || !MONGODB_URI) return;
  await mongoose.connect(MONGODB_URI, { tls: true, tlsAllowInvalidCertificates: true });
  connected = true;
  console.log('[db] MongoDB connected');
}
