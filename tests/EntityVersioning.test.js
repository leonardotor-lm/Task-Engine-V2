import test from "node:test";
import assert from "node:assert/strict";

import { Task } from "../src/domain/Task.js";
import { Area } from "../src/domain/Area.js";
import { Context } from "../src/domain/Context.js";
import { Tag } from "../src/domain/Tag.js";

test("las entidades nuevas comienzan en la versión 1", () => {

    const entities = [
        new Task({ title: "Tarea" }),
        new Area({ name: "Área" }),
        new Context({ name: "Contexto" }),
        new Tag({ name: "Etiqueta" })
    ];

    for (const entity of entities) {
        assert.equal(entity.version, 1);
    }

});

test("cada modificación incrementa la versión", () => {

    const task = new Task({ title: "Tarea" });
    const area = new Area({ name: "Área" });
    const context = new Context({ name: "Contexto" });
    const tag = new Tag({ name: "Etiqueta" });

    task.update({ title: "Tarea actualizada" });
    area.update({ name: "Área actualizada" });
    context.update({ name: "Contexto actualizado" });
    tag.update({ name: "Etiqueta actualizada" });

    assert.equal(task.version, 2);
    assert.equal(area.version, 2);
    assert.equal(context.version, 2);
    assert.equal(tag.version, 2);

});

test("los cambios de estado de una tarea incrementan su versión", () => {

    const task = new Task({ title: "Tarea" });

    task.complete();
    assert.equal(task.version, 2);

    task.reopen();
    assert.equal(task.version, 3);

    task.archive();
    assert.equal(task.version, 4);

    task.delete();
    assert.equal(task.version, 5);

    task.restoreFromTrash();
    assert.equal(task.version, 6);

});

test("la versión se conserva al serializar y reconstruir", () => {

    const task = new Task({ title: "Tarea" });

    task.update({ description: "Descripción" });

    const restored = new Task(task.toJSON());

    assert.equal(restored.version, 2);
    assert.equal(restored.toJSON().version, 2);

});

test("los datos anteriores sin versión siguen siendo compatibles", () => {

    const task = new Task({
        title: "Tarea anterior",
        version: undefined
    });

    assert.equal(task.version, 1);

});

test("rechaza versiones inválidas", () => {

    assert.throws(
        () => new Task({
            title: "Tarea",
            version: 0
        }),
        /versión/
    );

    assert.throws(
        () => new Area({
            name: "Área",
            version: 1.5
        }),
        /versión/
    );

});
