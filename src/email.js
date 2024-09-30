const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendEmail(events) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Filter out events with incomplete data
  const completeEvents = events.filter(
    (event) =>
      event.title !== 'No title' &&
      event.date !== 'No date' &&
      event.price !== 'Price not available' &&
      event.venue !== 'Venue not specified' &&
      event.purchaseLink
  );

  // Create HTML content
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1 { color: #2c3e50; }
          .event { margin-bottom: 20px; border-bottom: 1px solid #ecf0f1; padding-bottom: 10px; }
          .event h2 { color: #3498db; margin-bottom: 5px; }
          .event p { margin: 5px 0; }
          .event a { color: #e74c3c; text-decoration: none; }
          .event a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>New Tickets Available</h1>
        ${completeEvents
          .map(
            (event) => `
          <div class="event">
            <h2>${event.title}</h2>
            <p><strong>Date:</strong> ${event.date}</p>
            <p><strong>Price:</strong> ${event.price}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><a href="${event.purchaseLink}">Purchase Tickets</a></p>
          </div>
        `
          )
          .join('')}
      </body>
    </html>
  `;

  // Get recipients from environment variable
  const recipients = process.env.RECIPIENT_EMAILS
    ? process.env.RECIPIENT_EMAILS.split(',')
    : ['recipient1@example.com, recipient2@example.com'];

  const mailOptions = {
    from: `"Ticket Notifier" <${process.env.EMAIL_USER}>`,
    to: recipients.join(', '), // Join all recipients into a single string
    subject: 'Daily Ticket Availability Update',
    html: htmlContent,
  };

  try {
    // Only send email if there are complete events
    if (completeEvents.length > 0) {
      let info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully. Message ID:', info.messageId);
      console.log(
        `Sent information about ${completeEvents.length} events to ${recipients.length} recipients.`
      );
      return info;
    } else {
      console.log('No complete event information available. Email not sent.');
      return null;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = sendEmail;
