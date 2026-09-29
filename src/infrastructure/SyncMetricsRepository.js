const STORAGE_KEY = "task-engine-v2-sync-metrics-v1";
const LOAD_STORAGE_KEY = "task-engine-v2-sync-load-metric-v1";
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

    setLatestLoad(metric) {
        try {
            this.storage?.setItem(
                LOAD_STORAGE_KEY,
                JSON.stringify({
                    ...metric,
                    recordedAt: new Date().toISOString()
                })
            );
        } catch {
            // El diagnóstico no debe bloquear la sincronización.
        }
    }

    getLatestLoad() {
        try {
            return JSON.parse(
                this.storage?.getItem(LOAD_STORAGE_KEY) ?? "null"
            );
        } catch {
            return null;
        }
    }
}
