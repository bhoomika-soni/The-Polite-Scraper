const { z } = require("zod");

// Define the expected structure of a raw book record
const RawBookSchema = z.object({
    title: z.string().min(1),

    product_url: z.url().startsWith(
        "https://books.toscrape.com/"
    ),

    price_text: z.string().min(1),

    availability_text: z.string().min(1),

    rating_text: z.enum([
        "One",
        "Two",
        "Three",
        "Four",
        "Five"
    ]).nullable(),

    description: z.string().nullable(),

    source_page: z.url().startsWith(
        "https://books.toscrape.com/"
    ),

    fetched_at: z.iso.datetime()
});

// Convert price text into a numeric GBP value
function normalizePrice(priceText) {
    if (typeof priceText !== "string") {
        throw new Error("Price must be a string");
    }

    const match = priceText.match(/£\s*(\d+(?:\.\d{1,2})?)/);

    if (!match) {
        throw new Error(`Invalid price format: ${priceText}`);
    }

    const price = Number(match[1]);

    if (!Number.isFinite(price)) {
        throw new Error(`Invalid numeric price: ${priceText}`);
    }

    return price;
}

// Validate, normalize, and return the finished record
function validateAndNormalize(rawBook) {
    const parsed = RawBookSchema.safeParse(rawBook);

    if (!parsed.success) {
        throw new Error(
            `Schema validation failed: ${JSON.stringify(
                parsed.error.issues
            )}`
        );
    }

    const book = parsed.data;

    const price = normalizePrice(book.price_text);

    return {
        ...book,
        price_gbp: price
    };
}

module.exports = {
    RawBookSchema,
    normalizePrice,
    validateAndNormalize
};