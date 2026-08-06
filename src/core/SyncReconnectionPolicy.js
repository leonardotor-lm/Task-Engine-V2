import {
    createSyncFingerprint
} from "./SyncFingerprint.js";

export const SyncReconnectionAction =
    Object.freeze({
        IDENTICAL: "IDENTICAL",
        PUSH: "PUSH",
        PULL: "PULL",
        CONFLICT: "CONFLICT"
    });

const COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags",
    "customFilters",
    "goals"
];

function normalizeForComparison(backup) {

    if (backup === null) {
        return null;
    }

    const data = backup?.data;

    if (!data) {
        throw new Error(
            "No se puede comparar una copia vacía."
        );
    }

    return {
        ...backup,
        data: {
            ...data,
            customFilters:
                Array.isArray(data.customFilters)
                    ? data.customFilters
                    : [],
            goals:
                Array.isArray(data.goals)
                    ? data.goals
                    : [],
            taskSortPreferences:
                data.taskSortPreferences &&
                typeof data.taskSortPreferences ===
                    "object" &&
                !Array.isArray(
                    data.taskSortPreferences
                )
                    ? data.taskSortPreferences
                    : {}
        }
    };

}

export function isSyncBackupEmpty(backup) {

    if (backup === null) {
        return true;
    }

    const normalized =
        normalizeForComparison(backup);
    const data = normalized.data;

    const collectionsEmpty =
        COLLECTIONS.every(
            collection =>
                Array.isArray(data[collection]) &&
                data[collection].length === 0
        );

    const preferencesEmpty =
        Object.keys(
            data.taskSortPreferences
        ).length === 0;

    return collectionsEmpty && preferencesEmpty;

}

export function createComparableSyncFingerprint(
    backup
) {

    if (backup === null) {
        return createSyncFingerprint({
            data: {
                tasks: [],
                areas: [],
                contexts: [],
                tags: [],
                customFilters: [],
                goals: [],
                taskSortPreferences: {}
            }
        });
    }

    return createSyncFingerprint(
        normalizeForComparison(backup)
    );

}

export function getSyncReconnectionAction({
    localBackup,
    remoteBackup
}) {

    const localEmpty =
        isSyncBackupEmpty(localBackup);
    const remoteEmpty =
        isSyncBackupEmpty(remoteBackup);

    if (localEmpty && remoteEmpty) {
        return SyncReconnectionAction.IDENTICAL;
    }

    if (remoteEmpty) {
        return SyncReconnectionAction.PUSH;
    }

    if (localEmpty) {
        return SyncReconnectionAction.PULL;
    }

    if (
        createComparableSyncFingerprint(
            localBackup
        ) ===
        createComparableSyncFingerprint(
            remoteBackup
        )
    ) {
        return SyncReconnectionAction.IDENTICAL;
    }

    return SyncReconnectionAction.CONFLICT;

}
