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

const PREFERENCE_MAPS = [
    "taskSortPreferences",
    "taskFilterPreferences",
    "displayPreferences"
];

function hasOwn(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object ?? {},
        property
    );

}

function stableValue(value) {

    if (value === undefined) {
        return "__undefined__";
    }

    if (Array.isArray(value)) {
        return value.map(stableValue);
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
                stableValue(value[key])
            ])
    );

}

function same(first, second) {

    return JSON.stringify(stableValue(first)) ===
        JSON.stringify(stableValue(second));

}

function mergeValue(base, local, remote) {

    if (same(local, remote)) {
        return {
            conflict: false,
            value: local
        };
    }

    if (same(local, base)) {
        return {
            conflict: false,
            value: remote
        };
    }

    if (same(remote, base)) {
        return {
            conflict: false,
            value: local
        };
    }

    return {
        conflict: true,
        value: undefined
    };

}

function entityContent(value) {

    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return value;
    }

    const {
        updatedAt,
        version,
        ...content
    } = value;

    return content;

}

function selectNewestEntity(local, remote) {

    const localVersion = Number(local?.version) || 0;
    const remoteVersion = Number(remote?.version) || 0;

    if (localVersion !== remoteVersion) {
        return localVersion > remoteVersion
            ? local
            : remote;
    }

    return String(local?.updatedAt ?? "") >=
        String(remote?.updatedAt ?? "")
        ? local
        : remote;

}

function mergeEntityValue(base, local, remote) {

    const result = mergeValue(
        base,
        local,
        remote
    );

    if (
        result.conflict &&
        local !== undefined &&
        remote !== undefined &&
        same(
            entityContent(local),
            entityContent(remote)
        )
    ) {
        return {
            conflict: false,
            value: selectNewestEntity(
                local,
                remote
            )
        };
    }

    return result;

}

function isEntityObject(value) {

    return Boolean(
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );

}

function mergeTaskEntityValue(base, local, remote) {

    const direct = mergeEntityValue(
        base,
        local,
        remote
    );

    if (!direct.conflict) {
        return direct;
    }

    if (
        !isEntityObject(base) ||
        !isEntityObject(local) ||
        !isEntityObject(remote)
    ) {
        return direct;
    }

    const technicalKeys = new Set([
        "version",
        "updatedAt"
    ]);
    const keys = new Set([
        ...Object.keys(base),
        ...Object.keys(local),
        ...Object.keys(remote)
    ]);
    const mergedContent = {};

    for (const key of keys) {

        if (technicalKeys.has(key)) {
            continue;
        }

        const result = mergeValue(
            base[key],
            local[key],
            remote[key]
        );

        if (result.conflict) {
            return direct;
        }

        if (result.value !== undefined) {
            mergedContent[key] = result.value;
        }

    }

    if (same(mergedContent, entityContent(local))) {
        return {
            conflict: false,
            value: local
        };
    }

    if (same(mergedContent, entityContent(remote))) {
        return {
            conflict: false,
            value: remote
        };
    }

    const version = Math.max(
        Number(base.version) || 0,
        Number(local.version) || 0,
        Number(remote.version) || 0
    ) + 1;

    return {
        conflict: false,
        value: {
            ...mergedContent,
            version,
            updatedAt: new Date().toISOString()
        }
    };

}

function collectionMap(items) {

    return new Map(
        (items ?? []).map(item => [
            item.id,
            item
        ])
    );

}

function collectionIds(...collections) {

    const ids = [];
    const seen = new Set();

    for (const items of collections) {

        for (const item of items ?? []) {

            if (!item?.id || seen.has(item.id)) {
                continue;
            }

            seen.add(item.id);
            ids.push(item.id);

        }

    }

    return ids;

}

function mergeCollection(
    collection,
    baseItems,
    localItems,
    remoteItems
) {

    const base = collectionMap(baseItems);
    const local = collectionMap(localItems);
    const remote = collectionMap(remoteItems);
    const merged = [];
    const conflicts = [];

    for (
        const id of collectionIds(
            localItems,
            remoteItems,
            baseItems
        )
    ) {

        const mergeEntity =
            collection === "tasks"
                ? mergeTaskEntityValue
                : mergeEntityValue;
        const result = mergeEntity(
            base.get(id),
            local.get(id),
            remote.get(id)
        );

        if (result.conflict) {
            conflicts.push(`${collection}:${id}`);
            continue;
        }

        if (result.value !== undefined) {
            merged.push(result.value);
        }

    }

    return {
        value: merged,
        conflicts
    };

}

function normalizeMap(value) {

    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return {};
    }

    return value;

}

function mergePreferenceMap(
    property,
    baseValue,
    localValue,
    remoteValue
) {

    const base = normalizeMap(baseValue);
    const local = normalizeMap(localValue);
    const remote = normalizeMap(remoteValue);
    const keys = new Set([
        ...Object.keys(base),
        ...Object.keys(local),
        ...Object.keys(remote)
    ]);
    const merged = {};
    const conflicts = [];

    for (const key of keys) {

        const result = mergeValue(
            base[key],
            local[key],
            remote[key]
        );

        if (result.conflict) {
            conflicts.push(`${property}:${key}`);
            continue;
        }

        if (result.value !== undefined) {
            merged[key] = result.value;
        }

    }

    return {
        value: merged,
        conflicts
    };

}

function readOptionalCollection(
    data,
    property,
    fallback
) {

    return hasOwn(data, property)
        ? data[property]
        : fallback;

}

function readPreferenceMap(
    data,
    property,
    fallback
) {

    return hasOwn(data, property)
        ? data[property]
        : fallback;

}

export function createThreeWayMergedSyncBackup({
    baseBackup,
    localBackup,
    remoteBackup
}) {

    if (
        !baseBackup?.data ||
        !localBackup?.data ||
        !remoteBackup?.data
    ) {
        return {
            backup: null,
            conflicts: ["missing-base"]
        };
    }

    const base =
        canonicalizeSyncBackup(baseBackup);
    const local =
        canonicalizeSyncBackup(localBackup);
    const remote =
        canonicalizeSyncBackup(remoteBackup);

    const data = {};
    const conflicts = [];

    for (const collection of CORE_COLLECTIONS) {

        const result = mergeCollection(
            collection,
            base.data[collection] ?? [],
            local.data[collection] ?? [],
            remote.data[collection] ?? []
        );

        data[collection] = result.value;
        conflicts.push(...result.conflicts);

    }

    for (const collection of OPTIONAL_COLLECTIONS) {

        const baseItems =
            base.data[collection] ?? [];
        const localItems = readOptionalCollection(
            local.data,
            collection,
            baseItems
        );
        const remoteItems = readOptionalCollection(
            remote.data,
            collection,
            baseItems
        );
        const result = mergeCollection(
            collection,
            baseItems,
            localItems,
            remoteItems
        );

        data[collection] = result.value;
        conflicts.push(...result.conflicts);

    }

    for (const property of PREFERENCE_MAPS) {

        const baseValue =
            base.data[property] ?? {};
        const localValue = readPreferenceMap(
            local.data,
            property,
            baseValue
        );
        const remoteValue = readPreferenceMap(
            remote.data,
            property,
            baseValue
        );
        const result = mergePreferenceMap(
            property,
            baseValue,
            localValue,
            remoteValue
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
