import cron from 'node-cron';
import { Op } from 'sequelize';
import Transaction, { TransactionStatus } from '../models/Transaction';
import Property from '../models/Property';
import { notificationInAppService } from '../services/notification-inapp.service';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export const initMonthlyPaymentReminderJob = (): void => {
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('💰 Running monthly payment reminder check...');

      const transactions = await Transaction.findAll({
        where: {
          status: {
            [Op.in]: [TransactionStatus.PAYMENT_CONFIRMED, TransactionStatus.COMPLETED],
          },
          completedAt: { [Op.ne]: null },
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'title'],
          },
        ],
      });

      let reminderCount = 0;

      for (const tx of transactions) {
        const startDate = tx.completedAt || tx.createdAt;
        if (!startDate) continue;

        const property = (tx as any).property as Property | undefined;
        if (!property) continue;

        const monthsSinceStart = Math.floor(
          (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        for (let m = 0; m <= monthsSinceStart + 1; m++) {
          const dueDate = addMonths(new Date(startDate), m + 1);
          const daysLeft = daysUntil(dueDate);

          if (daysLeft === 7) {
            await notificationInAppService.notifyMonthlyPaymentReminder(
              tx.clientId,
              property.title,
              property.id,
              dueDate,
            );
            reminderCount++;
          }
        }
      }

      if (reminderCount > 0) {
        console.log(`💰 Sent ${reminderCount} monthly payment reminders`);
      }
    } catch (error) {
      console.error('❌ Error in monthly payment reminder job:', error);
    }
  });

  console.log('✅ Monthly payment reminder job initialized (runs daily at 8:00 AM)');
};
