# Weather Delay Checker

A small Node.js script that checks live weather for a batch of delivery orders and
flags the ones likely to be delayed - built for the AI Intern take-home assignment.

It reads orders from `orders.json`, checks each city's current weather against
OpenWeatherMap **concurrently**, marks bad-weather orders as `Delayed`, and generates a
personalized apology message for each one. One invalid city in the batch won't crash
the run - it's logged and skipped, and everything else still completes.

## How it works

1. Read all orders from `orders.json`.
2. Fetch the weather for every order's city **at the same time** using `Promise.all`
   (not one request after another).
3. For each order:
   - If the weather's `main` condition is `Rain`, `Snow`, or `Extreme` → mark the order
     `Delayed` and generate a short apology message.
   - Otherwise → leave it as is.
   - If the city can't be found (or any other API error) → log the error and move on,
     without stopping the rest of the batch.
4. Write the updated statuses back to `orders.json`.

## Project structure

```
weather-delay-checker/
├── index.js          # main script
├── package.json
├── orders.json        # sample data - gets updated in place after each run
├── .env.example       # copy to .env and add your real API key
└── README.md
```

## Requirements

- Node.js **18+** (the script uses the built-in global `fetch` - no extra HTTP library)
- A free OpenWeatherMap API key → https://openweathermap.org/api

Check your Node version:
```bash
node -v
```

## Setup

```bash
git clone <this-repo-url>
cd weather-delay-checker
npm install
cp .env.example .env
```

Open `.env` and add your real key:
```
OPENWEATHER_API_KEY=your_actual_key_here
```


## Run

```bash
npm start
```
(equivalent to `node index.js`)

## Sample output

```
Checking weather for 4 orders concurrently...

[DELAYED] Order 1001 (Alice Smith) - weather in New York is "Rain"
   Apology message: "Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!"
[OK] Order 1002 (Bob Jones) - weather in Mumbai is "Clear", no delay
[DELAYED] Order 1003 (Charlie Green) - weather in London is "Snow"
   Apology message: "Hi Charlie, your order to London is delayed due to heavy snow. We appreciate your patience!"

Done. orders.json has been updated.
```
```
[ERROR] Order 1004 (InvalidCity123): Weather API error for "InvalidCity123": 404 city not found
```
(That error line prints alongside the rest - the script keeps going and still finishes
processing every valid city.)

## Verifying it worked

1. Run `npm start` - you should see one console line per order, plus a final "Done" line.
2. Open `orders.json` - any order whose city had matching bad weather at the time you
   ran it now shows `"status": "Delayed"`. `InvalidCity123` stays `"Pending"` - its
   error is only logged to the console, not written into the order data.
3. Since New York/Mumbai/London's weather changes day to day, *which* orders end up
   `Delayed` depends on the actual weather when you run it - that's expected, not a bug.

## Resilience & security

- **Doesn't crash on bad input**: each order is fetched inside its own `try/catch`, so
  one 404 (or any other failure) can't take down the whole batch - `Promise.all` still
  resolves with every order accounted for.
- **No hardcoded API key**: the key is loaded from `.env` via `dotenv`. `.env.example`
  is committed so anyone cloning the repo knows what variable to set, without ever
  seeing a real key.

## AI Log - prompts used while building this

- **Parallel fetching**: *"Write a Node.js function that fetches data for a list of
  items concurrently using `Promise.all`, not sequentially, and returns the results in
  the same order as the input array."*
- **Error handling**: *"How do I make sure that if one item in a `Promise.all` call
  fails (e.g. a 404 from an API), the whole batch doesn't reject and the other items
  still complete? I need to catch errors per-item and keep going."*
- **Weather-Aware Apology function**: *"Write a small function that takes a customer's
  name, city, and a weather condition (Rain/Snow/Extreme) and returns one friendly
  sentence apologizing for a delivery delay, using only the customer's first name."*
- **.env usage**: *"Show me how to load an API key from a `.env` file in Node.js using
  `dotenv` instead of hardcoding it."*

## Notes / assumptions

- Uses the built-in `fetch` (Node 18+), so `dotenv` is the only real dependency.
- The three delay-triggering conditions (`Rain`, `Snow`, `Extreme`) are matched exactly
  as specified in the assignment, against OpenWeatherMap's `weather[0].main` field.
- `orders.json` is treated as the "local database" as instructed - the script reads and
  overwrites it directly rather than using an actual database.
