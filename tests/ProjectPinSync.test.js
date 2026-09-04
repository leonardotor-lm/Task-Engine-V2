import test from "node:test";
import assert from "node:assert/strict";

import {
    SyncOptionalDataBridge
} from "../src/core/SyncOptionalDataBridge.js";
import {
    ProjectPinPreferences
} from "../src/infrastructure/ProjectPinPreferences.js";

function createStorage() {
    const values = new Map();

    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        }
    };
}

function createBackupService() {
    return {
        createBackup() {
            return {
                data: {
                    tasks: [],
                    areas: [],
                    contexts: [],
                    tags: []
                }
            };
        },
        parseAndValidate(json) {
            return JSON.parse(json).data;
        },
        getApplyOperations() {
            return [];
        },
        customFilterRepository: {
            getAll: () => []
        }
    };
}

function createSyncApp(projectPinPreferences) {
    return {
        projectPinPreferences,
        backupService: createBackupService(),
        taskSortPreferencesRepository: {
            getAll: () => ({}),
            replaceAll: value => value
        },
        taskDisplayPreferences: {
            getSidebarTitle: () => "",
            setSidebarTitle: value => value
        }
    };
}

test("incluye los proyectos anclados en la copia sincronizable", () => {
    const preferences = new ProjectPinPreferences(
        createStorage()
    );
    preferences.setPinned("project-1", true);

    const app = createSyncApp(preferences);
    new SyncOptionalDataBridge(app).start();

    assert.deepEqual(
        app.backupService.createBackup()
            .data.projectPinPreferences,
        { "project-1": true }
    );
});

test("importa los proyectos anclados de otro dispositivo", () => {
    const preferences = new ProjectPinPreferences(
        createStorage()
    );
    preferences.setPinned("project-local", true);

    const app = createSyncApp(preferences);
    new SyncOptionalDataBridge(app).start();

    const data = app.backupService.parseAndValidate(
        JSON.stringify({
            data: {
                projectPinPreferences: {
                    "project-remote": true
                }
            }
        })
    );
    const operations =
        app.backupService.getApplyOperations(data);

    for (const [repository, value] of operations) {
        repository.replaceAll(value);
    }

    assert.deepEqual(
        preferences.getPinnedProjectIds(),
        ["project-remote"]
    );
});

test("desancla automáticamente proyectos que dejan de estar activos", () => {
    for (const methodName of [
        "completeTasks",
        "archiveTasks",
        "deleteTasks",
        "updateTask"
    ]) {
        const preferences = new ProjectPinPreferences(
            createStorage()
        );
        preferences.setPinned("project-1", true);
        preferences.setPinned("project-2", true);

        let activeIds = ["project-1", "project-2"];
        const taskService = {
            getActiveProjectRoots() {
                return activeIds.map(id => ({ id }));
            },
            [methodName](...args) {
                activeIds = ["project-2"];
                return args;
            }
        };

        new SyncOptionalDataBridge({
            projectPinPreferences: preferences,
            taskService
        }).start();

        taskService[methodName]("project-1");

        assert.deepEqual(
            preferences.getPinnedProjectIds(),
            ["project-2"],
            `${methodName} debe limpiar el anclado`
        );
    }
});

test("rechaza preferencias remotas de anclado inválidas", () => {
    const preferences = new ProjectPinPreferences(
        createStorage()
    );
    const app = createSyncApp(preferences);
    new SyncOptionalDataBridge(app).start();

    assert.throws(
        () => app.backupService.parseAndValidate(
            JSON.stringify({
                data: {
                    projectPinPreferences: {
                        "project-1": false
                    }
                }
            })
        ),
        /proyecto anclado inválido/
    );
});
