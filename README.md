# The Polite Scraper

A Node.js web scraping pipeline that collects book information from the Books to Scrape practice website and converts HTML into validated JSON records.

## Features

- Fetches the first three catalogue pages.
- Discovers book detail URLs dynamically.
- Extracts book information using Cheerio.
- Uses local HTML caching.
- Sends an identifying User-Agent.
- Implements request timeouts and request delays.
- Normalizes book prices into numeric values.
- Validates records with Zod.
- Prevents duplicate records using canonical product URLs.
- Saves invalid records separately.
- Generates a JSON run report.

## Tech Stack

- Node.js
- JavaScript
- Fetch API
- Cheerio
- Zod
- JSON
- Git and GitHub

## Installation

Install Node.js 20 or newer.

Clone the repository, navigate to the project folder, and install dependencies:

```bash
npm install
```

## Run

```bash
npm start
```

## Output Files

- `output/books.json`: Validated book records.
- `output/errors.json`: Records or pages that failed processing.
- `output/run-report.json`: Run statistics.

## Target Classification

The target is Books to Scrape, a public practice website intended for scraping exercises.

The scraper is limited to the first three catalogue pages and their book detail pages.

The robots.txt file is checked before scraping, and the result is documented after inspection.

The scraper uses an identifying User-Agent, request timeouts, request delays, and a local HTML cache.

I will not reuse this code on another site without checking its rules and terms first.

## Ethical Scraping

Use official APIs when available. Respect the site's terms and access rules. Do not bypass authentication, paywalls, or access restrictions. Collect only the data needed for the task.

## Limitations

The scraper depends on the website's HTML structure. If the site's selectors or page layout change, the extraction logic may need to be updated.