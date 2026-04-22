import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority'
    });

    console.log('✅ MongoDB Connected');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    return null;
  }
};

export default connectDB;
