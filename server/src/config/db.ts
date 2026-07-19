import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/service-request-db';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB connection warning: ${(error as Error).message}`);
    console.warn('Continuing without a database connection. Seed and request routes will fail until MongoDB is reachable.');
  }
};
