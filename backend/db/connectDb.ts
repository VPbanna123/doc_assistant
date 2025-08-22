import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
      const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    await mongoose.connect(uri); 
    console.log('MongoDB Connected');
  } catch (error: any) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;
