import test from "node:test";
import assert from "node:assert/strict";

import {
    compileAdvancedSearch
} from "../src/core/AdvancedSearch.js";
import {
    StrictAdvancedSearchResultsController
} from "../src/ui/StrictAdvancedSearchResultsController.js";
import { TaskList } from "../src/ui/TaskList.js";
import { TaskStatus } from "../src/domain/TaskStatus.js";

function task(overrides = {}) {
    return {
        id: overrides.id,
        title: overrides.title ?? "Tarea",
        description: overrides.description ?? "",
        status: overrides.status ?? TaskStatus.PENDING,
        areaId: overrides.areaId ?? null,
        contextId: overrides.contextId ?? null,
        tagIds: overrides.tagIds ?? [],
        goalIds: overrides.goalIds ?? [],
        priority: overrides.priority ?? 0,
        dueDate: overrides.dueDate ?? null,
        dueTime: overrides.dueTime ?? null,
        startDate: overrides.startDate ?? null,
        parentTaskId: overrides.parentTaskId ?? null,
        recurrence: overrides.recurrence ?? null,
        postponements: overrides.postponements ?? [],
        isProject: overrides.isProject ?? false,
        isCompleted() {
            return this.status === TaskStatus.COMPLETED;
        },
        isArchived() {
            return this.status === TaskStatus.ARCHIVED;
        },
        isDeleted() {
            return this.status === TaskStatus.DELETED;
        }
    };
}

test("la búsqueda avanzada conserva sólo las tareas que coinciden directamente", () => {

    const parent = task({
        id: "parent",
        title: "Proyecto anual",
        contextId: null,
        isProject: true
    });
    const child = task({
        id: "child",
        title: "Comprar materiales",
        parentTaskId: parent.id,
        contextId: "street"
    });

    const app = {
        advancedSearchExpression:
            compileAdvancedSearch(
                "contexto:Calle"
            )
    };

    const controller =
        new StrictAdvancedSearchResultsController(app);

    const result = controller.filterState({
        advancedSearchMode: true,
        tasks: [parent, child],
        allTasks: [parent, child],
        contexts: [
            { id: "street", name: "Calle" }
        ],
        areas: [],
        tags: [],
        goals: [],
        today: "2026-08-20",
        selectedTaskIds: new Set([
            parent.id,
            child.id
        ])
    });

    assert.deepEqual(
        result.tasks.map(item => item.id),
        ["child"]
    );
    assert.deepEqual(
        [...result.selectedTaskIds],
        ["child"]
    );

});

test("una subtarea aislada muestra la ruta de su padre como contexto", () => {

    const parent = task({
        id: "parent",
        title: "Proyecto anual",
        isProject: true
    });
    const child = task({
        id: "child",
        title: "Comprar materiales",
        parentTaskId: parent.id,
        contextId: "street"
    });

    const html = new TaskList().render(
        [child],
        "Resultados",
        false,
        [],
        [],
        [],
        "contexto:Calle",
        new Set(),
        true,
        new Set(),
        false,
        null,
        true,
        "2026-08-20",
        [parent, child]
    );

    assert.match(
        html,
        /taskHierarchyPath/
    );
    assert.match(
        html,
        /Proyecto anual/
    );
    assert.doesNotMatch(
        html,
        /data-id="parent"/
    );

});
