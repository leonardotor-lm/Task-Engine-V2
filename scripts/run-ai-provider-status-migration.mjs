import fs from "node:fs";

const originalReadFileSync = fs.readFileSync.bind(fs);

fs.readFileSync = function(path, options) {
    const value = originalReadFileSync(path, options);

    return typeof value === "string"
        ? value.replace(/\r\n/g, "\n")
        : value;
};

await import("./migrate-ai-provider-status.mjs");
