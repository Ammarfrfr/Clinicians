import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import configurePassport from './middlewares/passport.js';

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

// Routes import
import authRoute from './routes/auth.routes.js';
import analyzeRoute from './routes/anaylyse.js';
import recordingsRoute from './routes/recordings.js';
import patientRoute from './routes/patient.routes.js';
import whatsappRoute from './routes/whatsapp.routes.js';
import adminRoute from './routes/admin.routes.js';

// Routes use
app.use('/api/auth', authRoute);
app.use('/api', analyzeRoute);
app.use('/api/recordings', recordingsRoute);
app.use('/api/patients', patientRoute);
app.use('/api/whatsapp', whatsappRoute);
app.use('/api/admin', adminRoute);

export default app;
