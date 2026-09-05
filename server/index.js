import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './src/app.js';
import { connectDb } from './src/DB/db.connection.js';
import { initReminderCron } from './src/Utils/reminderCron.js';
import { initAppointmentReminderCron } from './src/Utils/appointmentReminderCron.js';

connectDb()
  .then(() => {
    const server = createServer(app);
    initReminderCron();
    initAppointmentReminderCron();

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err.message);
      const status = err.statusCode || err.status || 500;
      const message = err.message || 'Internal Server Error';
      res.status(status).json({ success: false, error: message });
    });

    server.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  });