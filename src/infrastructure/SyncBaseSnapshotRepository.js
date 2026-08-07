const STORAGE_KEY =
    "task-engine-v2-sync-base-backup-v1";

export class SyncBaseSnapshotRepository {

    constructor(storage = globalThis.localStorage) {

        this.storage = storage;

    }

    get() {

        const json =
            this.storage?.getItem(STORAGE_KEY);

        if (!json) return null;

        try {
            const backup = JSON.parse(json);
            return backup?.data ? backup : null;
        } catch {
            return null;
        }

    }

    set(backup) {

        if (!backup?.data) {
            throw new Error(
                "No se puede guardar una base de sincronización vacía."
            );
        }

        this.storage?.setItem(
            STORAGE_KEY,
            JSON.stringify(backup)
        );

        return backup;

    }

    clear() {

        this.storage?.removeItem(STORAGE_KEY);

    }

}
