const fs = require("node:fs/promises");
const path = require("node:path");

// Create a directory if it doesn't exist
async function ensureDir(directory) {
    await fs.mkdir(directory, { recursive: true });
}

// Save data as formatted JSON
async function saveJSON(filePath, data) {
    await ensureDir(path.dirname(filePath));

    await fs.writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

// Read JSON if the file exists
async function readJSON(filePath, fallback = null) {
    try {
        const content = await fs.readFile(filePath, "utf8");
        return JSON.parse(content);
    } catch (error) {
        if (error.code === "ENOENT") {
            return fallback;
        }

        throw error;
    }
}

// Wait before making the next real HTTP request
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

// Return the current timestamp in ISO format
function getTimestamp() {
    return new Date().toISOString();
}

module.exports = {
    ensureDir,
    saveJSON,
    readJSON,
    sleep,
    getTimestamp
};