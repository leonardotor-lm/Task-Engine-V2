import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { View } from "../src/core/View.js";
import {
    createSharedTaskDraft,
    getPwaLaunchRequest,
    PwaLaunchController
} from "../src/ui/PwaLaunchController.js";

const readProjectFile = path => readFile(
    new URL(`../${path}`, import.meta.url),
    "utf8"
);

test("el manifiesto declara Share Target y accesos rápidos Android", async () => {
    const manifest = JSON.parse(
        await readProjectFile("manifest.webmanifest")
    );

    assert.equal(
        manifest.share_target.action,
        "./?capture=share"
    );
    assert.equal(manifest.share_target.method, "GET");
    assert.deepEqual(
        manifest.share_target.params,
        { title: "title", text: "text", url: "url" }
    );
    assert.deepEqual(
        manifest.shortcuts.map(shortcut => shortcut.url),
        [
            "./?shortcut=new-task",
            "./?shortcut=inbox",
            "./?shortcut=today"
        ]
    );
});

test("prepara título notas y enlace sin duplicar contenido", () => {
    assert.deepEqual(
        createSharedTaskDraft({
            title: "Artículo interesante",
            text: "Leer para la clase\nhttps://example.com/texto",
            url: "https://example.com/texto"
        }),
        {
            title: "Artículo interesante",
            description: "Leer para la clase\n\nhttps://example.com/texto"
        }
    );

    assert.deepEqual(
        createSharedTaskDraft({
            text: "Idea para una actividad\nDesarrollar el cierre"
        }),
        {
            title: "Idea para una actividad",
            description: "Desarrollar el cierre"
        }
    );

    assert.deepEqual(
        createSharedTaskDraft({
            text: "https://example.com/recurso"
        }),
        {
            title: "Revisar enlace",
            description: "https://example.com/recurso"
        }
    );
});

test("reconoce los parámetros GET que Android entrega al Share Target", () => {
    const request = getPwaLaunchRequest(
        "https://example.com/app/?title=Texto&url=https%3A%2F%2Fexample.org"
    );

    assert.equal(request.type, "share");
    assert.equal(request.draft.title, "Texto");
    assert.equal(
        request.draft.description,
        "https://example.org"
    );
    assert.equal(
        getPwaLaunchRequest("https://example.com/app/"),
        null
    );
});

test("admite tanto el marcador propio como la URL GET generada por Android", () => {
    const withMarker = getPwaLaunchRequest(
        "https://example.com/app/?capture=share&text=Una%20idea"
    );
    const androidGet = getPwaLaunchRequest(
        "https://example.com/app/?text=Una%20idea"
    );

    assert.deepEqual(androidGet, withMarker);
    assert.equal(androidGet.type, "share");
    assert.equal(androidGet.draft.title, "Una idea");
});

test("abre la captura en Inbox y limpia los parámetros consumidos", () => {
    let appStarts = 0;
    let openedDraft = null;
    let replacedUrl = null;
    const app = {
        currentView: View.TODAY,
        start() {
            appStarts += 1;
        },
        navigateTo() {}
    };
    const controller = new PwaLaunchController(
        app,
        {
            openCreationDraft(draft) {
                openedDraft = draft;
            }
        },
        {
            windowRef: {
                location: {
                    href: "https://example.com/app/?capture=share&title=Clase&text=Preparar%20gu%C3%ADa&utm_source=android#inicio"
                },
                history: {
                    replaceState(_state, _title, url) {
                        replacedUrl = url;
                    }
                }
            }
        }
    );

    controller.start();
    app.start();

    assert.equal(appStarts, 1);
    assert.equal(app.currentView, View.INBOX);
    assert.deepEqual(openedDraft, {
        title: "Clase",
        description: "Preparar guía"
    });
    assert.equal(
        replacedUrl,
        "/app/?utm_source=android#inicio"
    );
});

test("los shortcuts navegan o abren una tarea nueva en Inbox", () => {
    const navigated = [];
    let newTasks = 0;
    const app = {
        currentView: View.TODAY,
        start() {},
        navigateTo(view) {
            navigated.push(view);
        }
    };
    const windowRef = {
        location: {
            href: "https://example.com/app/?shortcut=inbox"
        },
        history: { replaceState() {} }
    };
    const controller = new PwaLaunchController(
        app,
        {
            openCreationDraft() {
                newTasks += 1;
            }
        },
        { windowRef }
    );

    controller.consumeLaunchRequest();
    assert.deepEqual(navigated, [View.INBOX]);

    windowRef.location.href =
        "https://example.com/app/?shortcut=new-task";
    controller.consumeLaunchRequest();

    assert.equal(newTasks, 1);
    assert.equal(app.currentView, View.INBOX);
});
