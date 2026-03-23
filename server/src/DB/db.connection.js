import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const connection = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.warn('⚠️  Server will continue without database. Recordings will not be saved.');
    // Don't exit - allow server to run for testing
    return null;
  }
};

export default connectDB;
