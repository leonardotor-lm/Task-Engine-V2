import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const notionSource = readFileSync(
    new URL(
        "../google-apps-script/Notion.gs",
        import.meta.url
    ),
    "utf8"
);

test("el diagnóstico de esquema identifica propiedades faltantes y tipos incorrectos", () => {

    const context = {
        console,
        Error
    };

    context.protocolError_ = (
        code,
        publicMessage
    ) => {
        const error = new Error(publicMessage);
        error.code = code;
        error.publicMessage = publicMessage;
        return error;
    };

    vm.createContext(context);
    vm.runInContext(notionSource, context);

    assert.throws(
        () => context
            .validateNotionDataSourceSchema_({
                properties: {
                    Nombre: {
                        type: "title"
                    },
                    Tipo: {
                        type: "multi_select"
                    }
                }
            }),
        error => {
            assert.equal(
                error.code,
                "NOTION_SCHEMA_MISMATCH"
            );
            assert.match(
                error.publicMessage,
                /Tipo: se esperaba Selección y se encontró Selección múltiple/
            );
            assert.match(
                error.publicMessage,
                /Estado: falta la propiedad/
            );
            return true;
        }
    );

});
