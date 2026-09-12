const STORAGE_KEY =
    "task-engine-v2-pending-sync-changes-v1";

export class PendingSyncChangesRepository {
    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    get(endpoint = "") {
        const json = this.storage?.getItem(STORAGE_KEY);
        if (!json) return null;

        try {
            const state = JSON.parse(json);
            if (
                !Array.isArray(state?.changes) ||
                (endpoint && state.endpoint !== endpoint)
            ) {
                return null;
            }
            return state;
        } catch {
            return null;
        }
    }

    replace({ endpoint = "", baseRevision, changes }) {
        if (!Number.isInteger(baseRevision) || baseRevision < 0) {
            throw new Error("La revisión base de cambios es inválida.");
        }
        if (!Array.isArray(changes)) {
            throw new Error("El registro de cambios es inválido.");
        }

        const state = {
            endpoint,
            baseRevision,
            changes,
            updatedAt: new Date().toISOString()
        };
        this.storage?.setItem(STORAGE_KEY, JSON.stringify(state));
        return state;
    }

    clear() {
        this.storage?.removeItem(STORAGE_KEY);
    }
}
