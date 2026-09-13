# Weather Delay Checker

Checks the weather for every order's city (concurrently) using OpenWeatherMap, and marks
an order `Delayed` if the weather is Rain, Snow, or Extreme. Handles invalid cities without
crashing.

## Requirements
- Node.js 18 or newer (uses the built-in global `fetch`) — check with `node -v`
- A free OpenWeatherMap API key: https://openweathermap.org/api

## Setup
```bash
cd weather-delay-checker
npm install
cp .env.example .env
```
Open `.env` and paste your real key:
```
OPENWEATHER_API_KEY=your_actual_key_here
```

## Run
```bash
npm start
```
or
```bash
node index.js
```

## What you'll see
- Console output for each order: `[OK]` if weather is fine, `[DELAYED]` with the generated
  apology message if not, `[ERROR]` for cities the weather API can't find (e.g. `InvalidCity123`)
  — without the script stopping.
- `orders.json` gets overwritten in place with any `status` fields updated to `"Delayed"`.

## How to verify it worked
1. Run it once — you should see 4 lines of output (one per order) plus a final
   "Done" line.
2. Open `orders.json` afterward — orders whose city had bad weather at the time you ran
   it will show `"status": "Delayed"`; `InvalidCity123` stays `"Pending"` (its error is
   only logged to the console, not written into the order).
3. Note: since New York/Mumbai/London's weather changes day to day, which orders end up
   `Delayed` will depend on the actual weather when you run the script — that's expected
   and not a bug.

## AI Log — prompts used to build this
- **Parallel fetching**: "Write a Node.js function that fetches data for a list of items
  concurrently using `Promise.all`, not sequentially, and returns the results in the same
  order as the input array."
- **Error handling**: "How do I make sure that if one item in a `Promise.all` call fails
  (e.g. a 404 from an API), the whole batch doesn't reject and the other items still
  complete? I need to catch errors per-item and keep going."
- **Weather-Aware Apology function**: "Write a small function that takes a customer's
  name, city, and a weather condition (Rain/Snow/Extreme) and returns one friendly
  sentence apologizing for a delivery delay, using only the customer's first name."
- **.env usage**: "Show me how to load an API key from a `.env` file in Node.js using
  `dotenv` instead of hardcoding it."

## Notes
- Uses the built-in `fetch` (Node 18+), so no extra HTTP library is needed.
- The only dependency is `dotenv`, used purely to keep the API key out of the source code.
