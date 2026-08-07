const STORAGE_KEY =
    "task-engine-v2-sync-base-backup-v1";

export class SyncBaseSnapshotRepository {

    constructor(storage = globalThis.localStorage) {

        this.storage = storage;

    }

    get(endpoint = "") {

        const json =
            this.storage?.getItem(STORAGE_KEY);

        if (!json) return null;

        try {

            const state = JSON.parse(json);

            if (
                !state?.backup?.data ||
                (endpoint && state.endpoint !== endpoint)
            ) {
                return null;
            }

            return state.backup;

        } catch {
            return null;
        }

    }

    set(backup, endpoint = "") {

        if (!backup?.data) {
            throw new Error(
                "No se puede guardar una base de sincronización vacía."
            );
        }

        this.storage?.setItem(
            STORAGE_KEY,
            JSON.stringify({
                endpoint,
                backup
            })
        );

        return backup;

    }

    clear() {

        this.storage?.removeItem(STORAGE_KEY);

    }

}
