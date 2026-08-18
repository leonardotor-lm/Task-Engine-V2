const STORAGE_KEY_PREFIX = "task-engine-v2-notion-sync-retry";

function hashScope(scope) {

    const value = String(scope || "").trim();
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(16).padStart(8, "0");

}

export class NotionSyncRetryRepository {

    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    getStorageKey(scope) {

        const normalized = String(scope || "").trim();
        if (!normalized) return null;

        return `${STORAGE_KEY_PREFIX}:${hashScope(normalized)}`;

    }

    list(scope) {

        const storageKey = this.getStorageKey(scope);

        if (!storageKey || !this.storage?.getItem) return [];

        try {
            const parsed = JSON.parse(
                this.storage.getItem(storageKey) || "[]"
            );

            return Array.isArray(parsed)
                ? parsed.filter(item => item?.key)
                : [];
        } catch {
            return [];
        }

    }

    upsert(operation, scope) {

        const storageKey = this.getStorageKey(scope);

        if (
            !storageKey ||
            !operation?.key ||
            !this.storage?.setItem
        ) {
            return;
        }

        const items = this.list(scope);
        const index = items.findIndex(
            item => item.key === operation.key
        );
        const normalized = {
            ...operation,
            attempts: Number(operation.attempts ?? 0),
            updatedAt: new Date().toISOString()
        };

        if (index >= 0) {
            items[index] = {
                ...items[index],
                ...normalized
            };
        } else {
            items.push(normalized);
        }

        this.storage.setItem(
            storageKey,
            JSON.stringify(items)
        );

    }

    remove(key, scope) {

        const storageKey = this.getStorageKey(scope);

        if (
            !storageKey ||
            !key ||
            !this.storage?.setItem
        ) {
            return;
        }

        const remaining = this.list(scope).filter(
            item => item.key !== key
        );

        if (
            remaining.length === 0 &&
            this.storage.removeItem
        ) {
            this.storage.removeItem(storageKey);
            return;
        }

        this.storage.setItem(
            storageKey,
            JSON.stringify(remaining)
        );

    }

}
