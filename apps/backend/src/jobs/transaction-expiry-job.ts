import cron from 'node-cron';
import { TransactionExpiryService } from '../services/transaction-expiry.service';

const expiryService = new TransactionExpiryService();

export const initTransactionExpiryJob = (): void => {
  // Run every hour to check for expired transactions
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Running transaction expiry check...');
      const expiredCount = await expiryService.expireTransactions();
      if (expiredCount > 0) {
        console.log(`⏰ Processed ${expiredCount} expired transactions`);
      }
    } catch (error) {
      console.error('❌ Error in transaction expiry job:', error);
    }
  });

  console.log('✅ Transaction expiry job initialized (runs every hour)');
};
