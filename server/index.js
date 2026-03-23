import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/DB/db.connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

import analyzeRoute from './src/routes/anaylyse.js';
import recordingsRoute from './src/routes/recordings.js';

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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  console.log(`LLM Model: ${process.env.LLM_MODEL || 'llama3-13b-8192 (default)'}`);
});