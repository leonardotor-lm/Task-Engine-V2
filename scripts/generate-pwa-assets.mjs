import {
    readdir,
    writeFile
} from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(
    new URL("../", import.meta.url)
);
const INCLUDED_EXTENSIONS = new Set([
    ".css",
    ".js",
    ".png",
    ".svg",
    ".webmanifest"
]);
const INCLUDED_ROOT_FILES = new Set([
    "index.html",
    "manifest.webmanifest"
]);
const INCLUDED_DIRECTORIES = new Set([
    "icons",
    "src",
    "styles"
]);

async function collectFiles(directory = ROOT) {

    const entries = await readdir(
        directory,
        { withFileTypes: true }
    );
    const files = [];

    for (const entry of entries) {

        const absolutePath = join(
            directory,
            entry.name
        );
        const projectPath = relative(
            ROOT,
            absolutePath
        ).replaceAll("\\", "/");
        const rootDirectory =
            projectPath.split("/")[0];

        if (entry.isDirectory()) {
            if (INCLUDED_DIRECTORIES.has(rootDirectory)) {
                files.push(
                    ...await collectFiles(absolutePath)
                );
            }
            continue;
        }

        if (
            INCLUDED_ROOT_FILES.has(projectPath) ||
            (
                INCLUDED_DIRECTORIES.has(rootDirectory) &&
                INCLUDED_EXTENSIONS.has(
                    extname(entry.name)
                )
            ) ||
            (
                !projectPath.includes("/") &&
                extname(entry.name) === ".css"
            )
        ) {
            files.push(`./${projectPath}`);
        }

    }

    return files;

}

const assets = (await collectFiles())
    .filter(path => path !== "./service-worker.js")
    .sort();
const output = `self.__PWA_ASSETS = Object.freeze(${JSON.stringify(
    assets,
    null,
    4
)});\n`;

await writeFile(
    join(ROOT, "pwa-assets.js"),
    output,
    "utf8"
);
