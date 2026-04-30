import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // 2 seconds

export const connectDB = async (retryCount = 0): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined');
    }
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`⚠️  MongoDB Connection Failed. Retrying (${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_DELAY / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    } else {
      console.error('❌ MongoDB Connection Error - Max retries exceeded:', error);
      process.exit(1);
    }
  }
};
