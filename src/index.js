require('dotenv').config();
const scrapeTickets = require('./scraper');
const sendEmail = require('./email');

async function checkTicketsAndNotify() {
  console.log('Daily ticket check started at:', new Date().toLocaleString());
  try {
    console.log('Checking for ticket availability...');
    const events = await scrapeTickets();
    console.log(`Scrape completed. Found ${events.length} total events.`);

    if (events.length > 0) {
      console.log('Attempting to send email with available tickets...');
      try {
        const emailResult = await sendEmail(events);
        if (emailResult) {
          console.log(
            'Email sent successfully with available ticket information.'
          );
        } else {
          console.log(
            'No email sent. There might be no complete event information available.'
          );
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    } else {
      console.log('No events found during scraping.');
    }
  } catch (error) {
    console.error('Error during checkTicketsAndNotify:', error);
  }
  console.log('Daily ticket check completed at:', new Date().toLocaleString());
}

module.exports = { checkTicketsAndNotify };
