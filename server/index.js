import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './src/DB/db.connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
connectDB();

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

import analyzeRoute from './src/routes/anaylyse.js';
import recordingsRoute from './src/routes/recordings.js';
import patientRoute from './src/routes/patient.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', analyzeRoute);
app.use('/api/recordings', recordingsRoute);
app.use('/api/patients', patientRoute);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, error: message });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});