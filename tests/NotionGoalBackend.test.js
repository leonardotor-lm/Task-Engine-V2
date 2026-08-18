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

test("Notion usa Tipo Objetivo y mantiene la casilla vinculada", () => {

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
        return error;
    };

    vm.createContext(context);
    vm.runInContext(notionSource, context);

    const goal = context.normalizeNotionTaskData_({
        id: "goal-1",
        title: "Leer clásicos",
        status: "ACTIVE",
        entityType: "Objetivo",
        completedAt: null,
        linked: true
    });
    const properties =
        context.buildNotionTaskProperties_(
            goal,
            "Nombre"
        );

    assert.equal(
        properties.Tipo.select.name,
        "Objetivo"
    );
    assert.equal(
        properties.Estado.select.name,
        "Activa"
    );
    assert.equal(
        properties["Vinculada a Task Engine"].checkbox,
        true
    );

});

test("Notion permite marcar un objetivo como desvinculado", () => {

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
        return error;
    };

    vm.createContext(context);
    vm.runInContext(notionSource, context);

    const goal = context.normalizeNotionTaskData_({
        id: "goal-1",
        title: "Leer clásicos",
        status: "COMPLETED",
        entityType: "Objetivo",
        completedAt: "2026-08-18T12:00:00.000Z",
        linked: false
    });
    const properties =
        context.buildNotionTaskProperties_(
            goal,
            "Nombre"
        );

    assert.equal(
        properties.Estado.select.name,
        "Finalizada"
    );
    assert.equal(
        properties["Vinculada a Task Engine"].checkbox,
        false
    );

});
