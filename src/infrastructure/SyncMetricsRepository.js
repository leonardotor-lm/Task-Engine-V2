const STORAGE_KEY = "task-engine-v2-sync-metrics-v1";
const MAX_ENTRIES = 20;

export class SyncMetricsRepository {
    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    add(metric) {
        const entries = this.getAll();
        entries.push({
            ...metric,
            recordedAt: new Date().toISOString()
        });
        const retained = entries.slice(-MAX_ENTRIES);
        this.storage?.setItem(
            STORAGE_KEY,
            JSON.stringify(retained)
        );
        return metric;
    }

    getAll() {
        try {
            const value = JSON.parse(
                this.storage?.getItem(STORAGE_KEY) ?? "[]"
            );
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    getLatest() {
        const entries = this.getAll();
        return entries.at(-1) ?? null;
    }
}
