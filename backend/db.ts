import mongoose from 'mongoose';

let isConnected = false;

export async function connectBackendDb() {
  if (isConnected) return;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is required for backend server');
  }

  await mongoose.connect(mongoUri, { bufferCommands: false });
  isConnected = true;
}
