import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const codeSource = readFileSync(
    new URL("../google-apps-script/Code.gs", import.meta.url),
    "utf8"
);
const notionSource = readFileSync(
    new URL("../google-apps-script/Notion.gs", import.meta.url),
    "utf8"
);

function schema() {
    return {
        Name: { type: "title" },
        Tipo: { type: "select" },
        Estado: { type: "select" },
        "Task Engine ID": { type: "rich_text" },
        "Área": { type: "select" },
        Contextos: { type: "multi_select" },
        Etiquetas: { type: "multi_select" },
        "Fecha de finalización": { type: "date" },
        "Última actualización desde Task Engine": { type: "date" },
        "Vinculada a Task Engine": { type: "checkbox" }
    };
}

function loadBackend(fetchNotion) {
    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"],
        ["TASK_ENGINE_NOTION_TOKEN", "notion-secret"],
        ["TASK_ENGINE_NOTION_DATA_SOURCE_ID", "data-source-1"]
    ]);
    const output = payload => ({
        payload,
        setMimeType() { return this; },
        getContent() { return this.payload; }
    });
    const context = {
        console,
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: key => properties.get(key) ?? null
            })
        },
        CacheService: {
            getScriptCache: () => ({
                get: () => null,
                put: () => {}
            })
        },
        LockService: {
            getScriptLock: () => ({
                tryLock: () => true,
                releaseLock: () => {}
            })
        },
        ContentService: {
            MimeType: { JSON: "application/json" },
            createTextOutput: output
        },
        UrlFetchApp: {
            fetch: fetchNotion
        }
    };

    vm.createContext(context);
    vm.runInContext(codeSource, context);
    vm.runInContext(notionSource, context);
    return context;
}

function request(context, body) {
    const response = context.handleRequest_({
        postData: {
            contents: JSON.stringify(body)
        }
    }, "POST");
    return JSON.parse(response.getContent());
}

test("actualiza por PATCH la página ya vinculada y conserva su ID", () => {

    const calls = [];
    const backend = loadBackend((url, options) => {
        calls.push({ url, options });

        if (url.includes("/data_sources/")) {
            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({
                    object: "data_source",
                    id: "data-source-1",
                    title: [],
                    properties: schema()
                })
            };
        }

        return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
                object: "page",
                id: "page-1",
                url: "https://www.notion.so/page-1"
            })
        };
    });

    const result = request(backend, {
        action: "createNotionTaskPage",
        token: "sync-token",
        task: {
            id: "task-1",
            title: "Título actualizado",
            status: "PENDING",
            isProject: false,
            areaName: "Trabajo",
            contextNames: ["PC"],
            tagNames: ["Literatura"],
            completedAt: null,
            notionPageId: "page-1"
        }
    });

    assert.equal(result.ok, true);
    assert.equal(calls.length, 2);
    assert.match(calls[1].url, /\/pages\/page-1$/);
    assert.equal(calls[1].options.method, "patch");

    const payload = JSON.parse(calls[1].options.payload);
    assert.equal(
        payload.properties.Name.title[0].text.content,
        "Título actualizado"
    );
    assert.equal(
        payload.properties["Área"].select.name,
        "Trabajo"
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(
            payload.properties.Contextos.multi_select
        )),
        [{ name: "PC" }]
    );
    assert.equal(
        payload.properties["Vinculada a Task Engine"].checkbox,
        true
    );

});

test("puede marcar una página como desvinculada", () => {

    const calls = [];
    const backend = loadBackend((url, options) => {
        calls.push({ url, options });

        if (url.includes("/data_sources/")) {
            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({
                    object: "data_source",
                    id: "data-source-1",
                    title: [],
                    properties: schema()
                })
            };
        }

        return {
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({
                object: "page",
                id: "page-1",
                url: "https://www.notion.so/page-1"
            })
        };
    });

    const result = request(backend, {
        action: "createNotionTaskPage",
        token: "sync-token",
        task: {
            id: "task-1",
            title: "Preparar clase",
            status: "PENDING",
            isProject: false,
            areaName: "",
            contextNames: [],
            tagNames: [],
            completedAt: null,
            notionPageId: "page-1",
            linked: false
        }
    });

    assert.equal(result.ok, true);
    const payload = JSON.parse(calls[1].options.payload);
    assert.equal(
        payload.properties["Vinculada a Task Engine"].checkbox,
        false
    );

});
