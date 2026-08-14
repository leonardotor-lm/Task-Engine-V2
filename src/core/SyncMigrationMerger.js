import {
    canonicalizeSyncBackup
} from "./SyncBackupCanonicalizer.js";

const COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags",
    "customFilters",
    "goals",
    "activityEvents"
];

const PREFERENCE_MAPS = [
    "taskSortPreferences",
    "taskFilterPreferences",
    "displayPreferences"
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

function same(first, second) {

    return JSON.stringify(sortObjectKeys(first)) ===
        JSON.stringify(sortObjectKeys(second));

}

function mergeCollection(
    collection,
    localItems,
    remoteItems
) {

    const merged = new Map();
    const conflicts = [];

    for (const item of localItems ?? []) {

        if (!item?.id) {
            conflicts.push(`${collection}:sin-id`);
            continue;
        }

        merged.set(item.id, item);

    }

    for (const item of remoteItems ?? []) {

        if (!item?.id) {
            conflicts.push(`${collection}:sin-id`);
            continue;
        }

        const localItem = merged.get(item.id);

        if (
            localItem &&
            !same(localItem, item)
        ) {
            conflicts.push(
                `${collection}:${item.id}`
            );
            continue;
        }

        if (!localItem) {
            merged.set(item.id, item);
        }

    }

    return {
        value: [...merged.values()],
        conflicts
    };

}

function normalizeMap(value) {

    return value &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? value
        : {};

}

function mergePreferenceMap(
    property,
    localValue,
    remoteValue
) {

    const local = normalizeMap(localValue);
    const remote = normalizeMap(remoteValue);
    const merged = { ...local };
    const conflicts = [];

    for (
        const [key, value] of
        Object.entries(remote)
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                merged,
                key
            ) &&
            !same(merged[key], value)
        ) {
            conflicts.push(`${property}:${key}`);
            continue;
        }

        if (
            !Object.prototype.hasOwnProperty.call(
                merged,
                key
            )
        ) {
            merged[key] = value;
        }

    }

    return {
        value: merged,
        conflicts
    };

}

export function createConservativeMigrationSyncBackup({
    localBackup,
    remoteBackup
}) {

    if (!localBackup?.data || !remoteBackup?.data) {
        return {
            backup: null,
            conflicts: ["missing-backup"]
        };
    }

    const local =
        canonicalizeSyncBackup(localBackup);
    const remote =
        canonicalizeSyncBackup(remoteBackup);

    if (
        local.format !== remote.format ||
        local.version !== remote.version
    ) {
        return {
            backup: null,
            conflicts: ["format"]
        };
    }

    const data = {};
    const conflicts = [];

    for (const collection of COLLECTIONS) {

        const result = mergeCollection(
            collection,
            local.data[collection] ?? [],
            remote.data[collection] ?? []
        );

        data[collection] = result.value;
        conflicts.push(...result.conflicts);

    }

    for (const property of PREFERENCE_MAPS) {

        const result = mergePreferenceMap(
            property,
            local.data[property],
            remote.data[property]
        );

        data[property] = result.value;
        conflicts.push(...result.conflicts);

    }

    if (conflicts.length > 0) {
        return {
            backup: null,
            conflicts
        };
    }

    return {
        backup: {
            format: localBackup.format,
            version: localBackup.version,
            exportedAt:
                new Date().toISOString(),
            data
        },
        conflicts: []
    };

}
