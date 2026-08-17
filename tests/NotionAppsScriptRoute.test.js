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
