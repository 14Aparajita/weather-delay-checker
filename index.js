require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Statuses that, per the assignment, mean the delivery should be marked Delayed.
const DELAY_STATUSES = ['Rain', 'Snow', 'Extreme'];

if (!API_KEY) {
  console.error(
    'Missing OPENWEATHER_API_KEY. Copy .env.example to .env and add your key before running.'
  );
  process.exit(1);
}

/**
 * Weather-Aware Apology generator.
 * Builds a short, personalized message like:
 * "Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!"
 */
function buildApologyMessage(customerName, city, weatherMain) {
  const reasonMap = {
    Rain: 'heavy rain',
    Snow: 'heavy snow',
    Extreme: 'extreme weather conditions',
  };
  const reason = reasonMap[weatherMain] || 'unexpected weather conditions';
  const firstName = customerName.split(' ')[0];
  return `Hi ${firstName}, your order to ${city} is delayed due to ${reason}. We appreciate your patience!`;
}

/**
 * Fetches current weather for a single city from OpenWeatherMap.
 * Throws on a bad response so the caller can catch and log it without crashing the run.
 */
async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Weather API error for "${city}": ${response.status} ${
        errorBody.message || response.statusText
      }`
    );
  }

  return response.json();
}

/**
 * Processes one order: fetch weather, decide delay, generate apology if needed.
 * Any failure (bad city, network error, etc.) is caught here so Promise.all
 * below never rejects because of a single bad order.
 */
async function processOrder(order) {
  try {
    const weatherData = await fetchWeather(order.city);
    const mainStatus = weatherData.weather[0].main;

    if (DELAY_STATUSES.includes(mainStatus)) {
      order.status = 'Delayed';
      const apologyMessage = buildApologyMessage(order.customer, order.city, mainStatus);
      console.log(
        `[DELAYED] Order ${order.order_id} (${order.customer}) — weather in ${order.city} is "${mainStatus}"`
      );
      console.log(`   Apology message: "${apologyMessage}"`);
    } else {
      console.log(
        `[OK] Order ${order.order_id} (${order.customer}) — weather in ${order.city} is "${mainStatus}", no delay`
      );
    }
  } catch (err) {
    console.error(`[ERROR] Order ${order.order_id} (${order.city}): ${err.message}`);
    // Order is left as-is (still "Pending") — we log the problem and move on.
  }

  return order;
}

async function main() {
  const rawData = fs.readFileSync(ORDERS_FILE, 'utf-8');
  const orders = JSON.parse(rawData);

  console.log(`Checking weather for ${orders.length} orders concurrently...\n`);

  // Parallel fetching: all requests fire at once, not one after another.
  const updatedOrders = await Promise.all(orders.map(processOrder));

  fs.writeFileSync(ORDERS_FILE, JSON.stringify(updatedOrders, null, 2));
  console.log(`\nDone. ${ORDERS_FILE} has been updated.`);
}

main().catch((err) => {
  // Safety net in case something outside processOrder() goes wrong
  // (e.g. orders.json itself is missing or malformed).
  console.error('Fatal error running script:', err.message);
  process.exit(1);
});
