import cron from 'node-cron';
import { fetchAndSaveLeadsCore } from '../controllers/LeadController.js';

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] CRON: Running scheduled lead sync...`);
  try {
    const result = await fetchAndSaveLeadsCore();
    console.log(`[${new Date().toISOString()}] CRON: Fetched ${result.totalFetched}, New: ${result.totalNew}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] CRON ERROR:`, error.message);
  }
});

console.log('Cron job initialized to sync leads every 10 minutes');
