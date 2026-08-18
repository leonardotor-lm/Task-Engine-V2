const STORAGE_KEY = "task-engine-v2-notion-sync-retry";

export class NotionSyncRetryRepository {

    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    list() {

        if (!this.storage?.getItem) return [];

        try {
            const parsed = JSON.parse(
                this.storage.getItem(STORAGE_KEY) || "[]"
            );

            return Array.isArray(parsed)
                ? parsed.filter(item => item?.key)
                : [];
        } catch {
            return [];
        }

    }

    upsert(operation) {

        if (!operation?.key || !this.storage?.setItem) {
            return;
        }

        const items = this.list();
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
            STORAGE_KEY,
            JSON.stringify(items)
        );

    }

    remove(key) {

        if (!key || !this.storage?.setItem) return;

        const remaining = this.list().filter(
            item => item.key !== key
        );

        if (
            remaining.length === 0 &&
            this.storage.removeItem
        ) {
            this.storage.removeItem(STORAGE_KEY);
            return;
        }

        this.storage.setItem(
            STORAGE_KEY,
            JSON.stringify(remaining)
        );

    }

}
