const { metrics } = require("./scrapper")
const path = require("node:path");

const {
    ensureDir,
    saveJSON,
    getTimestamp
} = require("./utils");

const {
    discoverBooks,
    extractBookDetails
} = require("./extractor");

const {
    validateAndNormalize
} = require("./validator");

const OUTPUT_DIR = path.join(__dirname, "..", "output");

async function main() {
    const startedAt = Date.now();
    const startTime = getTimestamp();

    const booksPath = path.join(OUTPUT_DIR, "books.json");
    const errorsPath = path.join(OUTPUT_DIR, "errors.json");
    const reportPath = path.join(
        OUTPUT_DIR,
        "run-report.json"
    );

    await ensureDir(OUTPUT_DIR);

    const validBooks = new Map();
    const errors = [];

    let discoveredBooks = [];
    let pagesFetched = 0;
    let cacheHits = 0;
    let networkFetches = 0;
    let failedPages = 0;

    try {
        console.log("\n=== POLITE SCRAPER STARTED ===\n");

        // Stage 1 and 2: discover catalogue pages and book URLs
        discoveredBooks = await discoverBooks();

        // Stage 3, 4 and 5: extract, normalize, and validate
        for (const book of discoveredBooks) {
            try {
                const rawBook = await extractBookDetails(book);

                pagesFetched++;

                const normalizedBook =
                    validateAndNormalize(rawBook);

                // URL acts as the unique identity
                validBooks.set(
                    normalizedBook.product_url,
                    normalizedBook
                );

                console.log(
                    `[VALID] ${normalizedBook.title} | £${normalizedBook.price_gbp}`
                );
            } catch (error) {
                failedPages++;

                errors.push({
                    product_url: book.product_url,
                    source_page: book.source_page,
                    error: error.message,
                    failed_at: getTimestamp()
                });

                console.error(
                    `[FAILED] ${book.product_url}: ${error.message}`
                );
            }
        }
    } catch (error) {
        errors.push({
            stage: "catalogue-discovery",
            error: error.message,
            failed_at: getTimestamp()
        });

        console.error(
            `[FATAL] Catalogue discovery failed: ${error.message}`
        );
    }

    const finalBooks = [...validBooks.values()];

    // Persist results even when individual pages fail
    await saveJSON(booksPath, finalBooks);
    await saveJSON(errorsPath, errors);

    const report = {
    started_at: startTime,
    finished_at: getTimestamp(),
    duration_ms: Date.now() - startedAt,

    catalogue_pages_target: 3,

    discovered_book_urls: discoveredBooks.length,
    detail_pages_processed: pagesFetched,

    valid_records: finalBooks.length,
    invalid_records: errors.length,
    failed_pages: failedPages,

    cache_hits: metrics.cacheHits,
    network_fetches: metrics.networkFetches,

    success: errors.length === 0 &&
        finalBooks.length === 60
};

await saveJSON(reportPath, report);

    console.log("\n=== RUN SUMMARY ===");
    console.log(`Discovered books: ${discoveredBooks.length}`);
    console.log(`Valid records: ${finalBooks.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Failed pages: ${failedPages}`);
    console.log(`Duration: ${report.duration_ms} ms`);

    console.log("\nOutput files:");
    console.log("output/books.json");
    console.log("output/errors.json");
    console.log("output/run-report.json");

    console.log("\n=== POLITE SCRAPER FINISHED ===");
}

main().catch(error => {
    console.error("Unexpected application error:", error);
    process.exitCode = 1;
});