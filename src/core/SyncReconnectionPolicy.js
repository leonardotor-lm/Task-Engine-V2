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

function normalizeEntityCollection(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return [...value].sort((first, second) =>
        String(first?.id ?? "").localeCompare(
            String(second?.id ?? "")
        )
    );

}

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

    const normalizedData = {};

    for (const collection of COLLECTIONS) {
        normalizedData[collection] =
            normalizeEntityCollection(
                data[collection]
            );
    }

    normalizedData.taskSortPreferences =
        data.taskSortPreferences &&
        typeof data.taskSortPreferences ===
            "object" &&
        !Array.isArray(
            data.taskSortPreferences
        )
            ? data.taskSortPreferences
            : {};

    return {
        format: backup.format,
        version: backup.version,
        data: normalizedData
    };

}

function sortObjectKeys(value) {

    if (Array.isArray(value)) {
        return value.map(sortObjectKeys);
    }

    if (
        value === null ||
        typeof value !== "object"
    ) {
        return value;
    }

    return Object.fromEntries(
        Object.keys(value)
            .sort((first, second) =>
                first.localeCompare(second)
            )
            .map(key => [
                key,
                sortObjectKeys(value[key])
            ])
    );

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

    const normalized = backup === null
        ? normalizeForComparison({
            format: "task-engine-v2-backup",
            version: 1,
            data: {}
        })
        : normalizeForComparison(backup);

    return JSON.stringify(
        sortObjectKeys(normalized)
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
