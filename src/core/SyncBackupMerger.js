import {
    canonicalizeSyncBackup
} from "./SyncBackupCanonicalizer.js";

const CORE_COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags"
];

const OPTIONAL_COLLECTIONS = [
    "customFilters",
    "goals",
    "activityEvents"
];

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

function normalizeCollection(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return [...value].sort((first, second) =>
        String(first?.id ?? "").localeCompare(
            String(second?.id ?? "")
        )
    );

}

function valuesMatch(first, second) {

    return stableStringify(first) ===
        stableStringify(second);

}

function mergeEntityCollections(
    localItems,
    remoteItems
) {

    const mergedById = new Map();

    for (const item of normalizeCollection(localItems)) {

        if (!item?.id) {
            return null;
        }

        mergedById.set(item.id, item);

    }

    for (const item of normalizeCollection(remoteItems)) {

        if (!item?.id) {
            return null;
        }

        const localItem = mergedById.get(item.id);

        if (
            localItem &&
            !valuesMatch(localItem, item)
        ) {
            return null;
        }

        if (!localItem) {
            mergedById.set(item.id, item);
        }

    }

    return [...mergedById.values()]
        .sort((first, second) =>
            String(first.id).localeCompare(
                String(second.id)
            )
        );

}

function mergePreferences(
    localPreferences,
    remotePreferences
) {

    const local =
        localPreferences &&
        typeof localPreferences === "object" &&
        !Array.isArray(localPreferences)
            ? localPreferences
            : {};
    const remote =
        remotePreferences &&
        typeof remotePreferences === "object" &&
        !Array.isArray(remotePreferences)
            ? remotePreferences
            : {};

    const merged = { ...local };

    for (
        const [viewKey, value] of
        Object.entries(remote)
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                merged,
                viewKey
            ) &&
            !valuesMatch(
                merged[viewKey],
                value
            )
        ) {
            return null;
        }

        merged[viewKey] = value;

    }

    return Object.fromEntries(
        Object.entries(merged)
            .sort(([first], [second]) =>
                first.localeCompare(second)
            )
    );

}

export function createSafeMergedSyncBackup({
    localBackup,
    remoteBackup
}) {

    if (!localBackup || !remoteBackup) {
        return null;
    }

    const local =
        canonicalizeSyncBackup(localBackup);
    const remote =
        canonicalizeSyncBackup(remoteBackup);

    if (
        !local?.data ||
        !remote?.data ||
        local.format !== remote.format ||
        local.version !== remote.version
    ) {
        return null;
    }

    for (const collection of CORE_COLLECTIONS) {

        if (
            !valuesMatch(
                normalizeCollection(
                    local.data[collection]
                ),
                normalizeCollection(
                    remote.data[collection]
                )
            )
        ) {
            return null;
        }

    }

    const mergedData = {};

    for (const collection of CORE_COLLECTIONS) {
        mergedData[collection] =
            normalizeCollection(
                local.data[collection]
            );
    }

    for (const collection of OPTIONAL_COLLECTIONS) {

        const merged = mergeEntityCollections(
            local.data[collection],
            remote.data[collection]
        );

        if (merged === null) {
            return null;
        }

        mergedData[collection] = merged;

    }

    for (
        const property of [
            "taskSortPreferences",
            "taskFilterPreferences"
        ]
    ) {

        const mergedPreferences =
            mergePreferences(
                local.data[property],
                remote.data[property]
            );

        if (mergedPreferences === null) {
            return null;
        }

        mergedData[property] =
            mergedPreferences;

    }

    return {
        format: local.format,
        version: local.version,
        data: mergedData
    };

}
