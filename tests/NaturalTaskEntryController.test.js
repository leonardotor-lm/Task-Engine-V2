import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
    NaturalTaskEntryController
} from "../src/ui/NaturalTaskEntryController.js";

function createControl(value = "") {
    return {
        value,
        disabled: false,
        dispatchEvent() {},
        focus() {}
    };
}

test("aplica la interpretación al borrador sin guardar la tarea", () => {
    const controls = {
        taskDueDate: createControl(),
        taskDueTime: createControl(),
        taskPriority: createControl("0"),
        taskArea: createControl(),
        taskContext: createControl(),
        naturalTaskEntryStatus: {
            textContent: "",
            hidden: true
        }
    };
    const documentRef = {
        getElementById(id) {
            return controls[id] || null;
        }
    };
    const app = {
        getTodayString: () => "2026-09-14",
        areaService: {
            getAllAreas: () => [
                { id: "personal", name: "Personal" }
            ]
        },
        contextService: {
            getAllContexts: () => [
                { id: "casa", name: "Casa" }
            ]
        },
        tagService: {
            getAllTags: () => [],
            getTagById: () => null
        }
    };
    const controller = new NaturalTaskEntryController(
        app,
        { documentRef }
    );
    const title = createControl(
        "Pagar seguro el viernes a las 18 !alta /Personal @Casa"
    );

    controller.interpret(title);

    assert.equal(title.value, "Pagar seguro");
    assert.equal(controls.taskDueDate.value, "2026-09-18");
    assert.equal(controls.taskDueTime.value, "18:00");
    assert.equal(controls.taskPriority.value, "3");
    assert.equal(controls.taskArea.value, "personal");
    assert.equal(controls.taskContext.value, "casa");
    assert.match(
        controls.naturalTaskEntryStatus.textContent,
        /Interpretado/
    );
    assert.equal(controls.naturalTaskEntryStatus.hidden, false);
});

test("el analizador local queda disponible en la aplicación y en la PWA", () => {
    const main = fs.readFileSync(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const assets = fs.readFileSync(
        new URL("../pwa-assets.js", import.meta.url),
        "utf8"
    );
    const index = fs.readFileSync(
        new URL("../index.html", import.meta.url),
        "utf8"
    );

    assert.match(main, /NaturalTaskEntryController/);
    assert.match(main, /naturalTaskEntryController\.start\(\)/);
    assert.match(assets, /NaturalTaskEntryParser\.js/);
    assert.match(assets, /NaturalTaskEntryController\.js/);
    assert.match(assets, /natural-task-entry\.css/);
    assert.match(index, /natural-task-entry\.css/);
});

test("la captura separada con IA vuelve a su alcance anterior", () => {
    const source = fs.readFileSync(
        new URL("../src/ui/AiTaskCaptureController.js", import.meta.url),
        "utf8"
    );

    assert.match(source, /Convertir texto en tareas/);
    assert.match(
        source,
        /La IA no asignará áreas, etiquetas, fechas ni prioridades/
    );
    assert.doesNotMatch(source, /Añadir con lenguaje natural/);
});
