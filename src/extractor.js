const cheerio = require("cheerio");

const { BASE_URL, fetchPage } = require("./scrapper");
const { getTimestamp } = require("./utils");

// Extract book URLs from one catalogue page
function extractBookLinks(html, pageURL) {
    const $ = cheerio.load(html);

    const links = [];

    $("article.product_pod h3 a").each((_, element) => {
        const href = $(element).attr("href");

        if (href) {
            const absoluteURL = new URL(href, pageURL).href;
            links.push(absoluteURL);
        }
    });

    return links;
}

// Find the next catalogue page
function extractNextPage(html, pageURL) {
    const $ = cheerio.load(html);

    const nextHref = $("li.next a").attr("href");

    if (!nextHref) {
        return null;
    }

    return new URL(nextHref, pageURL).href;
}

// Discover book links across the first three catalogue pages
async function discoverBooks() {
    const discoveredBooks = new Map();

    let currentPageURL = BASE_URL;
    let cataloguePages = 0;

    while (currentPageURL && cataloguePages < 3) {
        const result = await fetchPage(currentPageURL);
        const links = extractBookLinks(
            result.html,
            currentPageURL
        );

        for (const link of links) {
            if (!discoveredBooks.has(link)) {
                discoveredBooks.set(link, {
                    product_url: link,
                    source_page: currentPageURL
                });
            }
        }

        cataloguePages++;

        console.log(
            `[CATALOGUE] Page ${cataloguePages}: ${links.length} books`
        );

        if (cataloguePages < 3) {
            currentPageURL = extractNextPage(
                result.html,
                currentPageURL
            );
        }
    }

    const books = [...discoveredBooks.values()];

    console.log(`catalogue_pages=${cataloguePages}`);
    console.log(`discovered=${books.length}`);
    console.log(`unique_urls=${discoveredBooks.size}`);

    return books;
}

// Extract book details from a book page
async function extractBookDetails(book) {
    const result = await fetchPage(book.product_url);

    const $ = cheerio.load(result.html);

    const title = $("div.product_main h1").first().text().trim();

    const priceText = $("p.price_color").first().text().trim();

    const availabilityText = $("p.availability")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

    const ratingClass = $("p.star-rating")
        .first()
        .attr("class");

    let ratingText = null;

    if (ratingClass) {
        ratingText = ratingClass
            .split(/\s+/)
            .find(value => value !== "star-rating") || null;
    }

    const descriptionElement = $("#product_description")
        .nextAll("p")
        .first();

    const description = descriptionElement.length
        ? descriptionElement.text().trim()
        : null;

    return {
        title: title || null,
        product_url: book.product_url,
        price_text: priceText || null,
        availability_text: availabilityText || null,
        rating_text: ratingText,
        description,
        source_page: book.source_page,
        fetched_at: getTimestamp()
    };
}

module.exports = {
    discoverBooks,
    extractBookDetails
};