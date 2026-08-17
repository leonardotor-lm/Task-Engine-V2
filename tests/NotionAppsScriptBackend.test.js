import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const coreSource = readFileSync(
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

function loadBackend(overrides = {}) {
    const context = {
        console,
        ...overrides
    };

    vm.createContext(context);
    vm.runInContext(coreSource, context);
    vm.runInContext(notionSource, context);

    return context;
}

function notionFixture({
    token = "secret-token",
    dataSourceId = "data-source-1",
    statusCode = 200,
    responseBody = {
        object: "data_source",
        id: "data-source-1",
        title: [
            { plain_text: "Notas de Task Engine" }
        ]
    }
} = {}) {
    const properties = new Map();
    const requests = [];

    if (token !== null) {
        properties.set(
            "TASK_ENGINE_NOTION_TOKEN",
            token
        );
    }

    if (dataSourceId !== null) {
        properties.set(
            "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
            dataSourceId
        );
    }

    return {
        requests,
        context: {
            PropertiesService: {
                getScriptProperties: () => ({
                    getProperty: key =>
                        properties.get(key) ?? null
                })
            },
            UrlFetchApp: {
                fetch(url, options) {
                    requests.push({ url, options });

                    return {
                        getResponseCode: () =>
                            statusCode,
                        getContentText: () =>
                            JSON.stringify(responseBody)
                    };
                }
            }
        }
    };
}

test("informa Notion no configurado sin exponer secretos", () => {
    const fixture = notionFixture({
        token: null,
        dataSourceId: null
    });
    const backend = loadBackend(
        fixture.context
    );

    const status = backend.getNotionStatus_(
        false
    );

    assert.deepEqual(
        JSON.parse(JSON.stringify(status)),
        {
            ok: true,
            configured: false,
            connected: false,
            dataSourceId: "",
            dataSourceName: ""
        }
    );
});

test("valida la conexión usando token sólo en el backend", () => {
    const fixture = notionFixture();
    const backend = loadBackend(
        fixture.context
    );

    const status = backend.getNotionStatus_(
        true
    );

    assert.equal(status.configured, true);
    assert.equal(status.connected, true);
    assert.equal(
        status.dataSourceName,
        "Notas de Task Engine"
    );
    assert.equal(fixture.requests.length, 1);
    assert.equal(
        fixture.requests[0].url,
        "https://api.notion.com/v1/data_sources/data-source-1"
    );
    assert.equal(
        fixture.requests[0].options.headers.Authorization,
        "Bearer secret-token"
    );
    assert.equal(
        fixture.requests[0].options.headers[
            "Notion-Version"
        ],
        "2026-03-11"
    );
    assert.equal(
        JSON.stringify(status).includes(
            "secret-token"
        ),
        false
    );
});

test("el estado local nunca devuelve el token", () => {
    const fixture = notionFixture();
    const backend = loadBackend(
        fixture.context
    );

    const status = backend.getNotionStatus_(
        false
    );

    assert.equal(status.configured, true);
    assert.equal(status.connected, null);
    assert.equal(
        status.dataSourceId,
        "data-source-1"
    );
    assert.equal(
        Object.hasOwn(status, "token"),
        false
    );
});

test("traduce token inválido a error público de Notion", () => {
    const fixture = notionFixture({
        statusCode: 401,
        responseBody: {
            object: "error",
            code: "unauthorized"
        }
    });
    const backend = loadBackend(
        fixture.context
    );

    assert.throws(
        () => backend.getNotionStatus_(true),
        error =>
            error.code === "NOTION_UNAUTHORIZED"
    );
});

test("traduce falta de acceso a la base sin revelar configuración", () => {
    const fixture = notionFixture({
        statusCode: 403,
        responseBody: {
            object: "error",
            code: "restricted_resource"
        }
    });
    const backend = loadBackend(
        fixture.context
    );

    assert.throws(
        () => backend.getNotionStatus_(true),
        error =>
            error.code === "NOTION_FORBIDDEN" &&
            !String(error.publicMessage)
                .includes("secret-token")
    );
});

test("rechaza respuestas exitosas que no sean un data source", () => {
    const fixture = notionFixture({
        responseBody: {
            object: "database",
            id: "database-1"
        }
    });
    const backend = loadBackend(
        fixture.context
    );

    assert.throws(
        () => backend.getNotionStatus_(true),
        error =>
            error.code ===
                "NOTION_INVALID_RESPONSE"
    );
});
