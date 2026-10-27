const fs = require("node:fs/promises");
const path = require("node:path");

const { ensureDir, sleep } = require("./utils");

const BASE_URL = "https://books.toscrape.com/";

const CACHE_DIR = path.join(__dirname, "..", "cache");

const USER_AGENT =
    "PoliteScraper/1.0 (+https://github.com/your-username/polite-scraper)";

const REQUEST_TIMEOUT = 10000;
const REQUEST_DELAY = 500;

let lastRequestTime = 0;

const metrics = {
    cacheHits: 0,
    networkFetches: 0
}

// Convert a URL into a stable filename
function getCachePath(url) {
    const parsedURL = new URL(url);

    const filename = parsedURL.pathname
        .replace(/^\/+|\/+$/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");

    return path.join(
        CACHE_DIR,
        `${filename || "homepage"}.html`
    );
}

// Read HTML from the cache if available
async function readCachedHTML(filePath) {
    try {
        return await fs.readFile(filePath, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }

        throw error;
    }
}

// Enforce a delay between real requests
async function respectRequestDelay() {
    const elapsed = Date.now() - lastRequestTime;
    const remaining = REQUEST_DELAY - elapsed;

    if (remaining > 0) {
        await sleep(remaining);
    }
}

// Fetch a page with caching, timeout, and error handling
async function fetchPage(url, options = {}) {
    const { forceRefresh = false } = options;

    const cachePath = getCachePath(url);

    await ensureDir(CACHE_DIR);

    if (!forceRefresh) {
        const cachedHTML = await readCachedHTML(cachePath);

        if (cachedHTML !== null) {
            metrics.cacheHits++;
            console.log(`[CACHE HIT] ${url}`);

            return {
                html: cachedHTML,
                source: "cache",
                status: 200
            };
        }
    }

    await respectRequestDelay();

    console.log(`[FETCH] ${url}`);

    let response;

    try {
        response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
                "Accept": "text/html"
            },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT),
            redirect: "follow"
        });
    } catch (error) {
        throw new Error(
            `Request failed for ${url}: ${error.message}`
        );
    } finally {
        lastRequestTime = Date.now();
    }

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status} for ${url}`
        );
    }

    const html = await response.text();
    metrics.networkFetches++;

    // Save the successful response
    await fs.writeFile(cachePath, html, "utf8");

    console.log(
        `[SAVED] ${url} | ${Buffer.byteLength(html, "utf8")} bytes`
    );

    return {
        html,
        source: "network",
        status: response.status
    };
}

module.exports = {
    BASE_URL,
    fetchPage,
    metrics
};