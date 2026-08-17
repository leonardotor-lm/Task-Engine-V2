import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const codeSource = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);
const notionSource = readFileSync(
    new URL(
        "../google-apps-script/Notion.gs",
        import.meta.url
    ),
    "utf8"
);

function loadBackend({
    properties = new Map(),
    fetchNotion = null
} = {}) {

    const output = payload => ({
        payload,
        setMimeType() {
            return this;
        },
        getContent() {
            return this.payload;
        }
    });

    const context = {
        console,
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: key =>
                    properties.get(key) ?? null,
                setProperty: (key, value) =>
                    properties.set(key, value)
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
            MimeType: {
                JSON: "application/json"
            },
            createTextOutput: output
        },
        UrlFetchApp: {
            fetch: (...args) => {
                if (!fetchNotion) {
                    throw new Error(
                        "No debía consultar Notion"
                    );
                }
                return fetchNotion(...args);
            }
        }
    };

    vm.createContext(context);
    vm.runInContext(codeSource, context);
    vm.runInContext(notionSource, context);

    return context;
}

function request(context, body) {

    const response = context.handleRequest_(
        {
            postData: {
                contents: JSON.stringify(body)
            }
        },
        "POST"
    );

    return JSON.parse(response.getContent());
}

function notionSchema() {

    return {
        "Nombre": { type: "title" },
        "Tipo": { type: "select" },
        "Estado": { type: "select" },
        "Task Engine ID": {
            type: "rich_text"
        },
        "Área": { type: "select" },
        "Contextos": {
            type: "multi_select"
        },
        "Etiquetas": {
            type: "multi_select"
        },
        "Fecha de finalización": {
            type: "date"
        },
        "Última actualización desde Task Engine": {
            type: "date"
        }
    };

}

test("notionStatus informa configuración sin exponer el token", () => {

    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"],
        ["TASK_ENGINE_NOTION_TOKEN", "notion-secret"],
        [
            "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
            "data-source-1"
        ]
    ]);
    const backend = loadBackend({ properties });

    const result = request(backend, {
        action: "notionStatus",
        token: "sync-token",
        validateRemote: false
    });

    assert.equal(result.ok, true);
    assert.equal(result.configured, true);
    assert.equal(result.connected, null);
    assert.equal(
        result.dataSourceId,
        "data-source-1"
    );
    assert.equal(
        JSON.stringify(result).includes(
            "notion-secret"
        ),
        false
    );

});

test("notionStatus verifica remotamente la base configurada", () => {

    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"],
        ["TASK_ENGINE_NOTION_TOKEN", "notion-secret"],
        [
            "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
            "data-source-1"
        ]
    ]);
    let requestOptions = null;

    const backend = loadBackend({
        properties,
        fetchNotion: (url, options) => {
            requestOptions = { url, options };
            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({
                    object: "data_source",
                    id: "data-source-1",
                    title: [
                        {
                            plain_text:
                                "Notas de Task Engine"
                        }
                    ]
                })
            };
        }
    });

    const result = request(backend, {
        action: "notionStatus",
        token: "sync-token",
        validateRemote: true
    });

    assert.equal(result.connected, true);
    assert.equal(
        result.dataSourceName,
        "Notas de Task Engine"
    );
    assert.match(
        requestOptions.url,
        /\/data_sources\/data-source-1$/
    );
    assert.equal(
        requestOptions.options.headers
            .Authorization,
        "Bearer notion-secret"
    );

});

test("notionStatus conserva la autorización de Task Engine", () => {

    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"]
    ]);
    const backend = loadBackend({ properties });

    const result = request(backend, {
        action: "notionStatus",
        token: "wrong-token",
        validateRemote: false
    });

    assert.equal(result.ok, false);
    assert.equal(
        result.error.code,
        "UNAUTHORIZED"
    );

});

test("createNotionTaskPage crea la página con el esquema acordado", () => {

    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"],
        ["TASK_ENGINE_NOTION_TOKEN", "notion-secret"],
        [
            "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
            "data-source-1"
        ]
    ]);
    const calls = [];

    const backend = loadBackend({
        properties,
        fetchNotion: (url, options) => {
            calls.push({ url, options });

            if (url.endsWith(
                "/data_sources/data-source-1"
            )) {
                return {
                    getResponseCode: () => 200,
                    getContentText: () =>
                        JSON.stringify({
                            object: "data_source",
                            id: "data-source-1",
                            title: [
                                {
                                    plain_text:
                                        "Notas Task Engine"
                                }
                            ],
                            properties:
                                notionSchema()
                        })
                };
            }

            return {
                getResponseCode: () => 200,
                getContentText: () =>
                    JSON.stringify({
                        object: "page",
                        id: "page-1",
                        url:
                            "https://www.notion.so/page-1"
                    })
            };
        }
    });

    const result = request(backend, {
        action: "createNotionTaskPage",
        token: "sync-token",
        task: {
            id: "task-1",
            title: "Preparar clase",
            status: "PENDING",
            isProject: false,
            areaName: "Trabajo",
            contextNames: ["PC"],
            tagNames: [
                "Literatura",
                "Planificación"
            ],
            completedAt: null
        }
    });

    assert.equal(result.ok, true);
    assert.equal(result.pageId, "page-1");
    assert.equal(calls.length, 2);

    const createCall = calls[1];
    const payload = JSON.parse(
        createCall.options.payload
    );

    assert.match(
        createCall.url,
        /\/pages$/
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(payload.parent)),
        {
            type: "data_source_id",
            data_source_id: "data-source-1"
        }
    );
    assert.equal(
        payload.properties.Nombre
            .title[0].text.content,
        "Preparar clase"
    );
    assert.equal(
        payload.properties.Tipo.select.name,
        "Tarea"
    );
    assert.equal(
        payload.properties.Estado.select.name,
        "Activa"
    );
    assert.equal(
        payload.properties["Task Engine ID"]
            .rich_text[0].text.content,
        "task-1"
    );
    assert.equal(
        payload.properties["Área"]
            .select.name,
        "Trabajo"
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(
            payload.properties.Contextos
                .multi_select
        )),
        [{ name: "PC" }]
    );
    assert.deepEqual(
        JSON.parse(JSON.stringify(
            payload.properties.Etiquetas
                .multi_select
        )),
        [
            { name: "Literatura" },
            { name: "Planificación" }
        ]
    );
    assert.equal(
        createCall.options.headers.Authorization,
        "Bearer notion-secret"
    );

});

test("createNotionTaskPage identifica proyectos y estados finales", () => {

    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"],
        ["TASK_ENGINE_NOTION_TOKEN", "notion-secret"],
        [
            "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
            "data-source-1"
        ]
    ]);
    let createdPayload = null;

    const backend = loadBackend({
        properties,
        fetchNotion: (url, options) => {

            if (url.includes("/data_sources/")) {
                return {
                    getResponseCode: () => 200,
                    getContentText: () =>
                        JSON.stringify({
                            object: "data_source",
                            id: "data-source-1",
                            title: [],
                            properties:
                                notionSchema()
                        })
                };
            }

            createdPayload = JSON.parse(
                options.payload
            );

            return {
                getResponseCode: () => 200,
                getContentText: () =>
                    JSON.stringify({
                        object: "page",
                        id: "page-project",
                        url:
                            "https://www.notion.so/page-project"
                    })
            };
        }
    });

    const result = request(backend, {
        action: "createNotionTaskPage",
        token: "sync-token",
        task: {
            id: "project-1",
            title: "Proyecto escolar",
            status: "COMPLETED",
            isProject: true,
            areaName: "Trabajo",
            contextNames: [],
            tagNames: [],
            completedAt:
                "2026-08-17T20:00:00.000Z"
        }
    });

    assert.equal(result.ok, true);
    assert.equal(
        createdPayload.properties.Tipo
            .select.name,
        "Proyecto"
    );
    assert.equal(
        createdPayload.properties.Estado
            .select.name,
        "Finalizada"
    );
    assert.equal(
        createdPayload.properties[
            "Fecha de finalización"
        ].date.start,
        "2026-08-17T20:00:00.000Z"
    );

});

test("createNotionTaskPage rechaza una base con esquema distinto", () => {

    const properties = new Map([
        ["TASK_ENGINE_TOKEN", "sync-token"],
        ["TASK_ENGINE_NOTION_TOKEN", "notion-secret"],
        [
            "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
            "data-source-1"
        ]
    ]);

    const backend = loadBackend({
        properties,
        fetchNotion: () => ({
            getResponseCode: () => 200,
            getContentText: () =>
                JSON.stringify({
                    object: "data_source",
                    id: "data-source-1",
                    title: [],
                    properties: {
                        "Título": {
                            type: "title"
                        }
                    }
                })
        })
    });

    const result = request(backend, {
        action: "createNotionTaskPage",
        token: "sync-token",
        task: {
            id: "task-1",
            title: "Preparar clase"
        }
    });

    assert.equal(result.ok, false);
    assert.equal(
        result.error.code,
        "NOTION_SCHEMA_MISMATCH"
    );

});
