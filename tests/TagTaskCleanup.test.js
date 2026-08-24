import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { Tag } from "../src/domain/Tag.js";
import { Task } from "../src/domain/Task.js";
import { TagService } from "../src/core/TagService.js";
import { TaskService } from "../src/core/TaskService.js";
import {
    deleteTagWithTaskCleanup
} from "../src/core/TagTaskTransaction.js";

class MemoryRepository {

    constructor(items = []) {
        this.items = [...items];
        this.failNextUpdate = false;
        this.failNextRemove = false;
    }

    getAll() {
        return [...this.items];
    }

    getById(id) {
        return this.items.find(
            item => item.id === id
        ) ?? null;
    }

    updateMany(items) {
        const replacements = new Map(
            items.map(item => [item.id, item])
        );
        this.items = this.items.map(item =>
            replacements.get(item.id) ?? item
        );

        if (this.failNextUpdate) {
            this.failNextUpdate = false;
            throw new Error(
                "fallo al guardar tareas"
            );
        }
    }

    remove(id) {
        this.items = this.items.filter(
            item => item.id !== id
        );

        if (this.failNextRemove) {
            this.failNextRemove = false;
            throw new Error(
                "fallo al borrar etiqueta"
            );
        }
    }

    replaceAll(items) {
        this.items = [...items];
    }

}

function setup() {
    const removedTag = new Tag({
        id: "tag-removed",
        name: "Revisar"
    });
    const keptTag = new Tag({
        id: "tag-kept",
        name: "Trabajo"
    });
    const linkedTask = new Task({
        id: "task-linked",
        title: "Preparar clase",
        tagIds: [
            removedTag.id,
            keptTag.id
        ]
    });
    const unaffectedTask = new Task({
        id: "task-unaffected",
        title: "Comprar café",
        tagIds: [keptTag.id]
    });
    const taskRepository =
        new MemoryRepository([
            linkedTask,
            unaffectedTask
        ]);
    const tagRepository =
        new MemoryRepository([
            removedTag,
            keptTag
        ]);

    return {
        taskRepository,
        tagRepository,
        taskService:
            new TaskService(taskRepository),
        tagService:
            new TagService(tagRepository)
    };
}

function createFilterRepository() {
    let preferences = {
        "view:all": {
            areaId: "",
            contextId: "",
            tagId: "tag-removed",
            priority: "",
            due: ""
        }
    };

    return {
        getAll: () => structuredClone(
            preferences
        ),
        replaceAll: next => {
            preferences = structuredClone(next);
        },
        clearTag(tagId) {
            for (
                const filters of
                Object.values(preferences)
            ) {
                if (filters.tagId === tagId) {
                    filters.tagId = "";
                }
            }
        }
    };
}

test("elimina una etiqueta y la desafecta de todas las tareas", () => {
    const {
        taskRepository,
        tagRepository,
        taskService,
        tagService
    } = setup();

    const filterRepository =
        createFilterRepository();
    const updated = deleteTagWithTaskCleanup(
        tagService,
        taskService,
        "tag-removed",
        filterRepository
    );

    assert.deepEqual(
        updated.map(task => task.id),
        ["task-linked"]
    );
    assert.deepEqual(
        taskRepository
            .getById("task-linked")
            .tagIds,
        ["tag-kept"]
    );
    assert.deepEqual(
        tagRepository
            .getAll()
            .map(tag => tag.id),
        ["tag-kept"]
    );
    assert.equal(
        filterRepository
            .getAll()["view:all"]
            .tagId,
        ""
    );
});

test("restaura tareas y etiquetas si falla guardar las tareas", () => {
    const {
        taskRepository,
        tagRepository,
        taskService,
        tagService
    } = setup();

    taskRepository.failNextUpdate = true;

    assert.throws(
        () => deleteTagWithTaskCleanup(
            tagService,
            taskService,
            "tag-removed"
        ),
        /fallo al guardar tareas/
    );

    assert.deepEqual(
        taskRepository
            .getById("task-linked")
            .tagIds,
        ["tag-removed", "tag-kept"]
    );
    assert.equal(
        tagRepository.getAll().length,
        2
    );
});

test("restaura tareas y etiquetas si falla eliminar la etiqueta", () => {
    const {
        taskRepository,
        tagRepository,
        taskService,
        tagService
    } = setup();

    tagRepository.failNextRemove = true;

    assert.throws(
        () => deleteTagWithTaskCleanup(
            tagService,
            taskService,
            "tag-removed"
        ),
        /fallo al borrar etiqueta/
    );

    assert.deepEqual(
        taskRepository
            .getById("task-linked")
            .tagIds,
        ["tag-removed", "tag-kept"]
    );
    assert.deepEqual(
        tagRepository
            .getAll()
            .map(tag => tag.id),
        ["tag-removed", "tag-kept"]
    );
});

test("la interfaz ofrece revisar o eliminar y desafectar", async () => {
    const mainView = await readFile(
        new URL(
            "../src/ui/MainView.js",
            import.meta.url
        ),
        "utf8"
    );
    const app = await readFile(
        new URL(
            "../src/core/App.js",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(
        mainView,
        /Ver \$\{activeUsageCount\}[\s\S]*?Eliminar y desafectar/
    );
    assert.match(
        mainView,
        /Dialog\.chooseAsync\([\s\S]*?tareas activas/
    );
    assert.match(
        mainView,
        /choice === "review"[\s\S]*?reviewUsage/
    );
    assert.match(
        app,
        /onReviewTagTasks:[\s\S]*?View\.ALL[\s\S]*?tagId: id/
    );
    assert.match(
        app,
        /deleteTagWithTaskCleanup\(\s*this\.tagService,\s*this\.taskService,\s*id,\s*this[\s\S]*?taskFilterPreferencesRepository\s*\)/
    );
});
