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

function loadNotion() {

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

    return context;
}

test("el diagnóstico de esquema identifica propiedades faltantes y tipos incorrectos", () => {

    const context = loadNotion();

    assert.throws(
        () => context
            .validateNotionDataSourceSchema_({
                properties: {
                    Nombre: {
                        id: "title",
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

test("detecta la propiedad de título aunque Notion use otro nombre visible", () => {

    const context = loadNotion();
    const schema = context
        .validateNotionDataSourceSchema_({
            properties: {
                Name: {
                    id: "title",
                    name: "Name",
                    type: "title"
                },
                Tipo: { type: "select" },
                Estado: { type: "select" },
                "Task Engine ID": {
                    type: "rich_text"
                },
                "Área": { type: "select" },
                Contextos: {
                    type: "multi_select"
                },
                Etiquetas: {
                    type: "multi_select"
                },
                "Fecha de finalización": {
                    type: "date"
                },
                "Última actualización desde Task Engine": {
                    type: "date"
                }
            }
        });

    assert.equal(schema.titleName, "Name");

});
