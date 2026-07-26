import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import app from './app';
import { initDatabase } from './config/database';
import { initializeKYCJobs } from './jobs/kyc-jobs';
import { initRedis } from './config/redis';
import { initSocketIO } from './websocket/socket';
import { initTransactionExpiryJob } from './jobs/transaction-expiry-job';
import { initMessageDigestJob } from './jobs/message-digest-job';
import { initMonthlyPaymentReminderJob } from './jobs/monthly-payment-reminder.job';
import { dependencyValidator } from './services/dependency-validator.service';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Validate system dependencies (Requirements 11.1, 11.2, 11.3, 11.4, 11.5)
    await dependencyValidator.validateAll();

    // Initialize database
    await initDatabase();

    // Initialize Redis (non-blocking - app works without it)
    await initRedis();

    // Initialize scheduled jobs
    initializeKYCJobs();
    initTransactionExpiryJob();
    initMessageDigestJob();
    initMonthlyPaymentReminderJob();

    // Create HTTP server and attach Socket.IO
    const httpServer = http.createServer(app);
    initSocketIO(httpServer);
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log(`WebSocket available at ws://localhost:${PORT}`);
      console.log(`WebSocket available at ws://localhost:${PORT}/socket.io`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
