import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import configurePassport from './middlewares/passport.js';
import mongoose from 'mongoose';

const app = express();

// Configure Passport before routes
configurePassport();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CORS,
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || process.env.CORS === '*') {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for dev
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date(),
    database: dbStatus,
  });
});

// Routes import
import authRoute from './routes/auth.routes.js';
import analyzeRoute from './routes/anaylyse.js';
import recordingsRoute from './routes/recordings.js';
import patientRoute from './routes/patient.routes.js';
import whatsappRoute from './routes/whatsapp.routes.js';
import adminRoute from './routes/admin.routes.js';
import shareRoute from './routes/share.routes.js';

// Routes use
app.use('/api/auth', authRoute);
app.use('/api', analyzeRoute);
app.use('/api/recordings', recordingsRoute);
app.use('/api/patients', patientRoute);
app.use('/api/whatsapp', whatsappRoute);
app.use('/api/admin', adminRoute);
app.use('/api/share', shareRoute);

export default app;
