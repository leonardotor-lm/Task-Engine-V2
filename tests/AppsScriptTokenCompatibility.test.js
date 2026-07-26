import test from "node:test";
import assert from "node:assert/strict";
import {
    readFileSync
} from "node:fs";
import vm from "node:vm";

function createContext() {

    const source = readFileSync(
        new URL(
            "../google-apps-script/Code.gs",
            import.meta.url
        ),
        "utf8"
    );

    const cache = new Map();

    const context = {
        PropertiesService: {
            getScriptProperties() {
                return {
                    getProperty(name) {
                        return name ===
                            "TASK_ENGINE_TOKEN"
                            ? "secret-token"
                            : null;
                    }
                };
            }
        },
        CacheService: {
            getScriptCache() {
                return {
                    get(key) {
                        return cache.get(key) ?? null;
                    },
                    put(key, value) {
                        cache.set(key, value);
                    }
                };
            }
        },
        LockService: {
            getScriptLock() {
                return {
                    tryLock() {
                        return true;
                    },
                    releaseLock() {}
                };
            }
        },
        console: {
            warn() {}
        }
    };

    vm.createContext(context);
    vm.runInContext(source, context);

    return context;

}

test("Apps Script conserva la autenticación por URL durante la migración", () => {

    const context = createContext();

    assert.doesNotThrow(() =>
        context.authorize_(
            {
                parameter: {
                    token: "secret-token"
                }
            },
            {}
        )
    );

});

test("Apps Script acepta el token dentro del cuerpo JSON", () => {

    const context = createContext();

    assert.doesNotThrow(() =>
        context.authorize_(
            {
                parameter: {}
            },
            {
                token: "secret-token"
            }
        )
    );

});

test("Apps Script rechaza un token incorrecto en ambos formatos", () => {

    const context = createContext();

    assert.throws(
        () => context.authorize_(
            {
                parameter: {
                    token: "incorrecto"
                }
            },
            {}
        ),
        /Token de sincronización inválido/
    );

});

test("la carga admite POST con acción y token dentro del cuerpo", () => {

    const context = createContext();

    context.loadSnapshot_ = () => ({
        ok: true,
        revision: 3,
        data: null
    });

    context.jsonResponse_ = payload =>
        payload;

    const result = context.handleRequest_(
        {
            parameter: {},
            postData: {
                contents: JSON.stringify({
                    action: "load",
                    token: "secret-token"
                })
            }
        },
        "POST"
    );

    assert.equal(result.ok, true);
    assert.equal(result.revision, 3);

});


test("Apps Script rechaza solicitudes demasiado grandes antes de analizarlas", () => {

    const context = createContext();

    assert.throws(
        () => context.parseRequestBody_({
            postData: {
                contents: "x".repeat(
                    5000001
                )
            }
        }),
        /supera el tamaño permitido/
    );

});

test("Apps Script limita la cantidad de solicitudes autenticadas", () => {

    const context = createContext();

    for (let index = 0; index < 120; index += 1) {
        context.enforceRateLimit_();
    }

    assert.throws(
        () => context.enforceRateLimit_(),
        /demasiadas solicitudes/
    );

});

test("el registro de rechazos no incluye el token ni el contenido", () => {

    const context = createContext();
    const entries = [];

    context.console.warn = message => {
        entries.push(message);
    };

    context.logRejectedRequest_(
        {
            code: "UNAUTHORIZED",
            token: "secret-token",
            data: "contenido privado"
        },
        "POST"
    );

    assert.equal(entries.length, 1);
    assert.doesNotMatch(
        entries[0],
        /secret-token|contenido privado/
    );
    assert.match(
        entries[0],
        /UNAUTHORIZED/
    );

});
