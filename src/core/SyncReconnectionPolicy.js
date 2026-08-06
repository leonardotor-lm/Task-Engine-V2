export const SyncReconnectionAction =
    Object.freeze({
        IDENTICAL: "IDENTICAL",
        PUSH: "PUSH",
        PULL: "PULL",
        CONFLICT: "CONFLICT"
    });

const CORE_COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags"
];

const OPTIONAL_COLLECTIONS = [
    "customFilters",
    "goals"
];

const COLLECTIONS = [
    ...CORE_COLLECTIONS,
    ...OPTIONAL_COLLECTIONS
];

function hasOwn(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object ?? {},
        property
    );

}

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

function normalizePreferences(value) {

    return value &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? value
        : {};

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
        normalizePreferences(
            data.taskSortPreferences
        );

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

function stableStringify(value) {

    return JSON.stringify(
        sortObjectKeys(value)
    );

}

function valuesMatch(first, second) {

    return stableStringify(first) ===
        stableStringify(second);

}

function optionalValueIsEmpty(value) {

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    return Object.keys(value ?? {}).length === 0;

}

function getLegacyExtensionDirection({
    localBackup,
    remoteBackup
}) {

    const localData = localBackup?.data;
    const remoteData = remoteBackup?.data;

    if (!localData || !remoteData) {
        return null;
    }

    if (
        localBackup.format !== remoteBackup.format ||
        localBackup.version !== remoteBackup.version
    ) {
        return null;
    }

    for (const collection of CORE_COLLECTIONS) {

        if (
            !valuesMatch(
                normalizeEntityCollection(
                    localData[collection]
                ),
                normalizeEntityCollection(
                    remoteData[collection]
                )
            )
        ) {
            return null;
        }

    }

    let direction = null;

    const compareOptionalValue = (
        property,
        normalize
    ) => {

        const localHas =
            hasOwn(localData, property);
        const remoteHas =
            hasOwn(remoteData, property);
        const localValue = normalize(
            localData[property]
        );
        const remoteValue = normalize(
            remoteData[property]
        );

        if (localHas && remoteHas) {
            return valuesMatch(
                localValue,
                remoteValue
            );
        }

        if (!localHas && !remoteHas) {
            return true;
        }

        const presentValue = localHas
            ? localValue
            : remoteValue;

        if (optionalValueIsEmpty(presentValue)) {
            return true;
        }

        const nextDirection = localHas
            ? SyncReconnectionAction.PUSH
            : SyncReconnectionAction.PULL;

        if (
            direction &&
            direction !== nextDirection
        ) {
            return false;
        }

        direction = nextDirection;
        return true;

    };

    for (const collection of OPTIONAL_COLLECTIONS) {

        if (
            !compareOptionalValue(
                collection,
                normalizeEntityCollection
            )
        ) {
            return null;
        }

    }

    if (
        !compareOptionalValue(
            "taskSortPreferences",
            normalizePreferences
        )
    ) {
        return null;
    }

    return direction;

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

    return stableStringify(normalized);

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

    const legacyDirection =
        getLegacyExtensionDirection({
            localBackup,
            remoteBackup
        });

    if (legacyDirection) {
        return legacyDirection;
    }

    return SyncReconnectionAction.CONFLICT;

}
