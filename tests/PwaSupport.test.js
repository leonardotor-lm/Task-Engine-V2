import assert from "node:assert/strict";
import {
    readFile,
    readdir
} from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

import { PwaController } from "../src/ui/PwaController.js";

const readProjectFile = path => readFile(
    new URL(`../${path}`, import.meta.url),
    "utf8"
);

test("el manifiesto permite instalar Mis tareas", async () => {

    const manifest = JSON.parse(
        await readProjectFile("manifest.webmanifest")
    );

    assert.equal(manifest.name, "Mis tareas");
    assert.equal(manifest.lang, "es-AR");
    assert.equal(manifest.start_url, "./");
    assert.equal(manifest.scope, "./");
    assert.equal(manifest.display, "standalone");
    assert.ok(
        manifest.icons.some(icon =>
            icon.sizes === "192x192"
        )
    );
    assert.ok(
        manifest.icons.some(icon =>
            icon.sizes === "512x512" &&
            icon.purpose.includes("maskable")
        )
    );

});

test("la página registra los metadatos y habilita el service worker", async () => {

    const index = await readProjectFile("index.html");
    const main = await readProjectFile("src/main.js");

    assert.match(index, /rel="manifest" href="\.\/manifest\.webmanifest"/);
    assert.match(index, /name="theme-color" content="#2563eb"/);
    assert.match(index, /rel="apple-touch-icon"/);
    assert.match(index, /worker-src 'self'/);
    assert.match(main, /new PwaController\(app\)/);
    assert.match(main, /pwaController\.start\(\)/);

});

test("el service worker precarga la aplicación y responde sin conexión", async () => {

    const worker = await readProjectFile(
        "service-worker.js"
    );

    assert.match(worker, /cache\.addAll\(/);
    assert.match(worker, /cache: "reload"/);
    assert.match(worker, /url\.origin !== self\.location\.origin/);
    assert.match(worker, /networkFirst\(request\)/);
    assert.match(worker, /cache: "no-store"/);
    assert.match(worker, /cache\.match\(INDEX_URL\)/);

});

test("una navegación sin red recupera la interfaz precargada", async () => {

    const worker = await readProjectFile(
        "service-worker.js"
    );
    const listeners = {};
    const offlineShell = { source: "cache" };
    let fetchOptions = null;
    const cache = {
        async match(request) {
            return typeof request === "string" &&
                request.endsWith("/index.html")
                ? offlineShell
                : null;
        }
    };
    const context = {
        URL,
        importScripts() {
            context.self.__PWA_ASSETS = [
                "./index.html"
            ];
        },
        fetch: async (request, options) => {
            fetchOptions = options;
            throw new Error("Sin conexión");
        },
        caches: {
            async open() {
                return cache;
            }
        },
        self: {
            registration: {
                scope: "https://example.com/Task-Engine-V2/"
            },
            location: {
                origin: "https://example.com"
            },
            addEventListener(type, callback) {
                listeners[type] = callback;
            },
            clients: {
                async claim() {}
            },
            async skipWaiting() {}
        }
    };

    vm.runInNewContext(worker, context);

    const response = await context.networkFirst({
        mode: "navigate"
    });

    assert.equal(response, offlineShell);
    assert.equal(fetchOptions.cache, "no-store");
    assert.equal(typeof listeners.fetch, "function");

});

test("la precarga incluye todos los módulos de la aplicación", async () => {

    const assetSource = await readProjectFile(
        "pwa-assets.js"
    );
    const sourceFiles = await collectJavascriptFiles(
        new URL("../src/", import.meta.url)
    );

    sourceFiles.forEach(path => {
        assert.match(
            assetSource,
            new RegExp(`"\\.\\/src\\/${escapeRegex(path)}"`)
        );
    });

});

test("el controlador registra el service worker y ofrece la instalación", async () => {

    const listeners = {};
    const button = {
        hidden: false,
        disabled: true,
        textContent: "",
        onclick: null
    };
    const description = { textContent: "" };
    const registrations = [];
    let updateCalls = 0;
    const app = {
        mainView: {
            render() {}
        }
    };
    const controller = new PwaController(app, {
        windowRef: {
            addEventListener(type, callback) {
                listeners[type] = callback;
            },
            matchMedia() {
                return { matches: false };
            }
        },
        documentRef: {
            getElementById(id) {
                return id === "installApp"
                    ? button
                    : description;
            }
        },
        navigatorRef: {
            serviceWorker: {
                async register(path, options) {
                    registrations.push({
                        path,
                        options
                    });
                    return {
                        active: {},
                        async update() {
                            updateCalls += 1;
                        }
                    };
                }
            }
        }
    });

    controller.start();
    await controller.registerServiceWorker();
    app.mainView.render({});

    assert.equal(button.hidden, false);
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "Cómo instalar");

    await button.onclick();

    assert.match(
        description.textContent,
        /menú del navegador/
    );

    let promptCalls = 0;
    const installPrompt = {
        preventDefault() {},
        async prompt() {
            promptCalls += 1;
        },
        userChoice: Promise.resolve({
            outcome: "accepted"
        })
    };

    listeners.beforeinstallprompt(installPrompt);

    assert.equal(button.hidden, false);
    assert.equal(button.disabled, false);
    assert.match(description.textContent, /Instalá Mis tareas/);

    await button.onclick();

    assert.equal(promptCalls, 1);
    assert.equal(button.hidden, true);
    assert.deepEqual(
        registrations,
        [{
            path: "./service-worker.js",
            options: {
                updateViaCache: "none"
            }
        }]
    );
    assert.equal(updateCalls, 1);

});

test("la instalación manual indica el menú de Chrome en Android", async () => {

    const button = {
        hidden: true,
        disabled: true,
        textContent: "",
        onclick: null
    };
    const description = { textContent: "" };
    const controller = new PwaController(
        { mainView: { render() {} } },
        {
            windowRef: {
                addEventListener() {},
                matchMedia() {
                    return { matches: false };
                }
            },
            documentRef: {
                getElementById(id) {
                    return id === "installApp"
                        ? button
                        : description;
                }
            },
            navigatorRef: {
                userAgent: "Mozilla/5.0 (Linux; Android 15) Chrome/140"
            }
        }
    );

    controller.start();
    controller.applyInstallState();
    await button.onclick();

    assert.equal(button.hidden, false);
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "Cómo instalar");
    assert.match(description.textContent, /menú ⋮ de Chrome/);

});

async function collectJavascriptFiles(directory) {

    const entries = await readdir(
        directory,
        { withFileTypes: true }
    );
    const files = [];

    for (const entry of entries) {
        const childUrl = new URL(
            entry.name + (entry.isDirectory() ? "/" : ""),
            directory
        );

        if (entry.isDirectory()) {
            const nested = await collectJavascriptFiles(
                childUrl
            );
            files.push(
                ...nested.map(path =>
                    `${entry.name}/${path}`
                )
            );
        } else if (entry.name.endsWith(".js")) {
            files.push(entry.name);
        }
    }

    return files;

}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("configuración incluye el acceso para instalar la aplicación", async () => {

    const sidebar = await readProjectFile(
        "src/ui/Sidebar.js"
    );

    assert.match(sidebar, /data-section="application"/);
    assert.match(sidebar, /id="installApp"/);
    assert.match(sidebar, /id="pwaInstallDescription"/);

});
