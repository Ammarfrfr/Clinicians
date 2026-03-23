import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('Attempting to connect to MongoDB...');
    
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000, // Increased timeout to 15 seconds
      socketTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.warn('⚠️  Could not connect to MongoDB Atlas.');
    console.warn('Make sure your IP address is whitelisted in MongoDB Atlas:');
    console.warn('1. Go to mongodb.com/cloud/atlas');
    console.warn('2. Navigate to Network Access (IP Whitelist)');
    console.warn('3. Add your current IP address or 0.0.0.0/0 for all IPs');
    console.warn('Server will continue, but recordings will be temporary.');
    return null;
  }
};

export default connectDB;
