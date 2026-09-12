import {
    canonicalizeSyncBackup
} from "./SyncBackupCanonicalizer.js";

export const SYNC_ENTITY_COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags",
    "goals",
    "customFilters",
    "activityEvents"
];

export const SYNC_PREFERENCE_COLLECTIONS = [
    "taskSortPreferences",
    "taskFilterPreferences",
    "projectPinPreferences",
    "displayPreferences"
];

function same(first, second) {
    return JSON.stringify(first) === JSON.stringify(second);
}

function byId(items) {
    return new Map(
        (Array.isArray(items) ? items : [])
            .map(item => [item.id, item])
    );
}

export function createIncrementalChanges(
    baseBackup,
    currentBackup
) {
    const base = canonicalizeSyncBackup(baseBackup)?.data;
    const current = canonicalizeSyncBackup(currentBackup)?.data;

    if (!base || !current) return null;

    const changes = [];

    for (const collection of SYNC_ENTITY_COLLECTIONS) {
        const baseItems = byId(base[collection]);
        const currentItems = byId(current[collection]);
        const ids = new Set([
            ...baseItems.keys(),
            ...currentItems.keys()
        ]);

        for (const id of ids) {
            const previous = baseItems.get(id);
            const next = currentItems.get(id);

            if (!previous && next) {
                changes.push({
                    collection,
                    id,
                    operation: "create",
                    value: next
                });
            } else if (previous && !next) {
                changes.push({
                    collection,
                    id,
                    operation: "delete"
                });
            } else if (!same(previous, next)) {
                changes.push({
                    collection,
                    id,
                    operation: "update",
                    value: next
                });
            }
        }
    }

    for (const collection of SYNC_PREFERENCE_COLLECTIONS) {
        if (!same(base[collection], current[collection])) {
            changes.push({
                collection,
                id: "preferences",
                operation: "update",
                value: current[collection] ?? {}
            });
        }
    }

    return changes;
}
