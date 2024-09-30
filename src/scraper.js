const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrapeTickets() {
  console.log('Starting scrapeTickets function...');

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true }); // Run in headless mode
    const page = await browser.newPage();

    // Set a custom user agent to mimic a real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    console.log('Navigating to the page...');
    await page.goto('https://lgl.mojekarte.si/si/celotna-ponudba.html', {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    console.log('Page loaded.');

    // Handle cookie notice
    try {
      console.log('Waiting for cookie policy notice...');
      await page.waitForSelector('#hide-cookie-policy-notice', {
        timeout: 20000,
      });
      await page.click('#hide-cookie-policy-notice');
      await page.waitForTimeout(1000);
      console.log('Cookie notice hidden.');
    } catch (error) {
      console.log(
        'No cookie policy notice found or already hidden:',
        error.message
      );
    }

    let events = [];
    let pageNumber = 1;

    while (true) {
      console.log(`Scraping page ${pageNumber}...`);

      await page.waitForSelector('.perf-wrapper', { timeout: 30000 });

      const pageEvents = await page.evaluate(() => {
        const eventNodes = document.querySelectorAll(
          '.perf-wrapper:not(.corner-ribon)'
        );
        return Array.from(eventNodes)
          .map((event) => {
            const titleElement = event.querySelector('.perf-info-title a');
            const dateElement = event.querySelector(
              '.perf-info-date .date-text'
            );
            const priceElement = event.querySelector('.perf-info-price-list b');
            const venueElement = event.querySelector('.perf-venue a');
            const purchaseLink = event.querySelector(
              '.fast-buy.buy-button:not(.disabled)'
            );

            return {
              title: titleElement ? titleElement.innerText.trim() : 'No title',
              date: dateElement ? dateElement.innerText.trim() : 'No date',
              price: priceElement
                ? priceElement.innerText.trim() + ' EUR'
                : 'Price not available',
              venue: venueElement
                ? venueElement.innerText.trim()
                : 'Venue not specified',
              purchaseLink: purchaseLink ? purchaseLink.href : null,
            };
          })
          .filter((event) => event.purchaseLink);
      });

      console.log(`Found ${pageEvents.length} events on page ${pageNumber}`);
      events = events.concat(pageEvents);

      // Check for next page without clicking
      const hasNextPage = await page.evaluate(() => {
        const nextButton = document.querySelector(
          '.navigation-top-pagination .next'
        );
        return nextButton && !nextButton.classList.contains('unavailable');
      });

      if (!hasNextPage) {
        console.log('No more pages to scrape.');
        break;
      }

      console.log('Navigating to next page...');
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
          page.click('.navigation-top-pagination .next'),
        ]);
        pageNumber++;
      } catch (error) {
        console.error('Error navigating to next page:', error.message);
        break;
      }
    }

    console.log(`Total events found: ${events.length}`);
    return events;
  } catch (error) {
    console.error('Error in scrapeTickets function:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = scrapeTickets;
