import test from "node:test";
import assert from "node:assert/strict";

import {
    ProjectPinPreferences
} from "../src/infrastructure/ProjectPinPreferences.js";
import {
    ProjectWorkspaceController
} from "../src/ui/ProjectWorkspaceController.js";

function createStorage() {

    const values = new Map();

    return {
        getItem(key) {
            return values.has(key)
                ? values.get(key)
                : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };

}

function createTask(
    id,
    {
        parentTaskId = null,
        isProject = true
    } = {}
) {
    return {
        id,
        parentTaskId,
        isProject,
        isCompleted: () => false,
        isArchived: () => false,
        isDeleted: () => false
    };
}

test("guarda y quita proyectos anclados", () => {

    const preferences =
        new ProjectPinPreferences(
            createStorage()
        );

    assert.equal(
        preferences.isPinned("project-1"),
        false
    );

    preferences.setPinned(
        "project-1",
        true
    );

    assert.equal(
        preferences.isPinned("project-1"),
        true
    );

    preferences.toggle("project-1");

    assert.equal(
        preferences.isPinned("project-1"),
        false
    );

});

test("descarta anclados que ya no son proyectos vigentes", () => {

    const preferences =
        new ProjectPinPreferences(
            createStorage()
        );

    preferences.setPinned("project-1", true);
    preferences.setPinned("project-2", true);

    assert.deepEqual(
        preferences.prune([
            "project-2",
            "project-3"
        ]),
        ["project-2"]
    );

});

test("ordena primero los árboles de proyectos anclados", () => {

    const preferences =
        new ProjectPinPreferences(
            createStorage()
        );
    preferences.setPinned("project-2", true);

    const project1 = createTask("project-1");
    const child1 = createTask(
        "child-1",
        {
            parentTaskId: "project-1",
            isProject: false
        }
    );
    const project2 = createTask("project-2");
    const child2 = createTask(
        "child-2",
        {
            parentTaskId: "project-2",
            isProject: false
        }
    );

    const controller =
        new ProjectWorkspaceController(
            {
                taskService: {}
            },
            {
                documentRef: null,
                pinPreferences: preferences
            }
        );

    const ordered =
        controller.orderPinnedProjectTrees([
            project1,
            child1,
            project2,
            child2
        ]);

    assert.deepEqual(
        ordered.map(task => task.id),
        [
            "project-2",
            "project-1",
            "child-1",
            "child-2"
        ]
    );

});

test("detecta agrupamiento activo en la vista Proyectos", () => {

    const app = {
        taskService: {},
        taskGroupingPreferencesRepository: {
            get(viewKey) {
                assert.equal(
                    viewKey,
                    "view:projects"
                );
                return "AREA";
            }
        }
    };

    const controller =
        new ProjectWorkspaceController(
            app,
            {
                documentRef: null,
                pinPreferences:
                    new ProjectPinPreferences(
                        createStorage()
                    )
            }
        );

    assert.equal(
        controller.isProjectsGroupingActive(),
        true
    );

    app.taskGroupingPreferencesRepository.get =
        () => "NONE";

    assert.equal(
        controller.isProjectsGroupingActive(),
        false
    );

});

test("sólo permite anclar proyectos principales activos", () => {

    const controller =
        new ProjectWorkspaceController(
            {
                taskService: {}
            },
            {
                documentRef: null,
                pinPreferences:
                    new ProjectPinPreferences(
                        createStorage()
                    )
            }
        );

    assert.equal(
        controller.isPinEligible(
            createTask("project")
        ),
        true
    );

    assert.equal(
        controller.isPinEligible(
            createTask(
                "nested",
                { parentTaskId: "project" }
            )
        ),
        false
    );

    assert.equal(
        controller.isPinEligible(
            createTask(
                "task",
                { isProject: false }
            )
        ),
        false
    );

});
