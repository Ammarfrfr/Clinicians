import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './src/DB/db.connection.js';
import { syncTemporaryRecordingsToMongoDB } from './src/utils/tempRecordingStore.js';
import Recording from './src/models/recording.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

// Listen for MongoDB connection events to sync temp recordings
mongoose.connection.on('connected', async () => {
  console.log('✅ MongoDB connection established, attempting to sync temporary recordings...');
  try {
    await syncTemporaryRecordingsToMongoDB(Recording);
  } catch (err) {
    console.error('Error syncing temporary recordings:', err.message);
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected, reverting to temporary storage');
});

import analyzeRoute from './src/routes/anaylyse.js';
import recordingsRoute from './src/routes/recordings.js';
import patientRoute from './src/routes/patient.routes.js';

const app = express();

// Enable CORS with specific origins for development
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug endpoint to check env vars
app.get('/api/debug', (req, res) => {
  res.json({
    port: process.env.PORT,
    llmModel: process.env.LLM_MODEL,
    env: 'development'
  });
});

app.use('/api', analyzeRoute);
app.use('/api/recordings', recordingsRoute);
app.use('/api/patients', patientRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL || 'llama3-13b-8192 (default)'}`);
});