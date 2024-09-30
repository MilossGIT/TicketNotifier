const cron = require('node-cron');
const { checkTicketsAndNotify } = require('./index');

console.log('Ticket availability checker started.');

// Function to run the check with error handling
async function runCheck() {
  console.log('Running daily ticket availability check...');
  try {
    await checkTicketsAndNotify();
    console.log('Daily ticket check completed successfully.');
  } catch (error) {
    console.error('Error during daily ticket check:', error);
  }
}

// Run immediately on startup
runCheck();

// Schedule to run daily at 9:00 AM
cron.schedule('0 9 * * *', runCheck, {
  scheduled: true,
  timezone: 'Europe/Ljubljana', // Adjust this to your timezone
});

console.log('Cron job scheduled to run daily at 9:00 AM.');

// Keep the script running
process.on('SIGINT', () => {
  console.log('Stopping ticket availability checker...');
  process.exit(0);
});
