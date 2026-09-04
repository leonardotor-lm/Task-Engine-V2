import test from "node:test";
import assert from "node:assert/strict";

import {
    createComparableSyncFingerprint,
    getSyncReconnectionAction,
    SyncReconnectionAction
} from "../src/core/SyncReconnectionPolicy.js";

function backup(projectPinPreferences) {

    const data = {
        tasks: [{
            id: "project-1",
            title: "Proyecto",
            isProject: true,
            version: 1
        }],
        areas: [],
        contexts: [],
        tags: []
    };

    if (projectPinPreferences !== undefined) {
        data.projectPinPreferences =
            projectPinPreferences;
    }

    return {
        format: "task-engine-v2-backup",
        version: 1,
        data
    };

}

test("detecta diferencias que sólo afectan proyectos anclados", () => {

    const withoutPins = backup({});
    const withPinnedProject = backup({
        "project-1": true
    });

    assert.notEqual(
        createComparableSyncFingerprint(
            withoutPins
        ),
        createComparableSyncFingerprint(
            withPinnedProject
        )
    );

});

test("descarga anclados cuando sólo la copia remota los contiene", () => {

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup(),
            remoteBackup: backup({
                "project-1": true
            })
        }),
        SyncReconnectionAction.PULL
    );

});

test("sube anclados cuando sólo la copia local los contiene", () => {

    assert.equal(
        getSyncReconnectionAction({
            localBackup: backup({
                "project-1": true
            }),
            remoteBackup: backup()
        }),
        SyncReconnectionAction.PUSH
    );

});
