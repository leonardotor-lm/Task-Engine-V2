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
