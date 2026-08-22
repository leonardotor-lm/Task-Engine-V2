import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
);
const port = Number(process.argv[2] || 4173);
const host = "127.0.0.1";

const contentTypes = new Map([
    [".css", "text/css; charset=utf-8"],
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".mjs", "text/javascript; charset=utf-8"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".webmanifest", "application/manifest+json; charset=utf-8"]
]);

function safePath(urlPath) {
    const pathname = decodeURIComponent(
        String(urlPath || "/").split("?")[0]
    );
    const relative = pathname === "/"
        ? "index.html"
        : pathname.replace(/^\/+/, "");
    const resolved = path.resolve(root, relative);

    return resolved.startsWith(`${root}${path.sep}`) ||
        resolved === path.join(root, "index.html")
        ? resolved
        : null;
}

const server = http.createServer(async (request, response) => {
    try {
        let filePath = safePath(request.url);
        if (!filePath) {
            response.writeHead(403).end("Forbidden");
            return;
        }

        const fileStat = await stat(filePath).catch(() => null);
        if (fileStat?.isDirectory()) {
            filePath = path.join(filePath, "index.html");
        }

        const body = await readFile(filePath);
        const contentType = contentTypes.get(
            path.extname(filePath).toLowerCase()
        ) || "application/octet-stream";

        response.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-store"
        });
        response.end(body);
    } catch {
        response.writeHead(404).end("Not Found");
    }
});

server.listen(port, host, () => {
    console.log(`Static server listening on http://${host}:${port}`);
});
