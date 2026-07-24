export const SYNC_URL_KEY = "leo_db_url_key";
export const SYNC_TOKEN_KEY =
    "leo_api_key_storage_key";
export const SYNC_REVISION_KEY =
    "task-engine-v2-sync-revision";
export const SYNC_FINGERPRINT_KEY =
    "task-engine-v2-sync-fingerprint";
export const SYNC_LAST_SUCCESS_KEY =
    "task-engine-v2-sync-last-success";

export class SyncConfig {

    constructor(storage = localStorage) {

        this.storage = storage;

    }

    validateUrl(value) {

        const url = String(value ?? "").trim();

        if (!url) {
            throw new Error(
                "Ingresá la URL del servicio de sincronización."
            );
        }

        let parsed;

        try {
            parsed = new URL(url);
        } catch {
            throw new Error(
                "La URL de sincronización no es válida."
            );
        }

        if (parsed.protocol !== "https:") {
            throw new Error(
                "La URL de sincronización debe usar HTTPS."
            );
        }

        return parsed.toString();

    }

    validateToken(value) {

        const token = String(value ?? "").trim();

        if (!token) {
            throw new Error(
                "Ingresá el token de sincronización."
            );
        }

        return token;

    }

    save({ url, token }) {

        const configuration = {
            url: this.validateUrl(url),
            token: this.validateToken(token)
        };

        const current = this.get();

        const connectionChanged =
            current.url !== configuration.url ||
            current.token !== configuration.token;

        this.storage.setItem(
            SYNC_URL_KEY,
            configuration.url
        );

        this.storage.setItem(
            SYNC_TOKEN_KEY,
            configuration.token
        );

        if (connectionChanged) {
            this.clearSyncState();
        }

        return configuration;

    }

    get() {

        return {
            url:
                this.storage.getItem(SYNC_URL_KEY) ??
                "",
            token:
                this.storage.getItem(SYNC_TOKEN_KEY) ??
                ""
        };

    }

    isConfigured() {

        const { url, token } = this.get();

        return Boolean(url && token);

    }

    clear() {

        this.storage.removeItem(SYNC_URL_KEY);
        this.storage.removeItem(SYNC_TOKEN_KEY);
        this.clearSyncState();

    }

    getRevision() {

        const value = Number(
            this.storage.getItem(SYNC_REVISION_KEY)
        );

        return Number.isInteger(value) && value >= 0
            ? value
            : 0;

    }

    setRevision(revision) {

        if (
            !Number.isInteger(revision) ||
            revision < 0
        ) {
            throw new Error(
                "La revisión de sincronización es inválida."
            );
        }

        this.storage.setItem(
            SYNC_REVISION_KEY,
            String(revision)
        );

    }

    clearRevision() {

        this.storage.removeItem(
            SYNC_REVISION_KEY
        );

    }

    markSynchronized(
        fingerprint,
        timestamp = new Date().toISOString()
    ) {

        if (!fingerprint) {
            throw new Error(
                "La huella de sincronización es inválida."
            );
        }

        const parsedTimestamp =
            Date.parse(timestamp);

        if (Number.isNaN(parsedTimestamp)) {
            throw new Error(
                "La fecha de sincronización es inválida."
            );
        }

        this.storage.setItem(
            SYNC_FINGERPRINT_KEY,
            fingerprint
        );

        this.storage.setItem(
            SYNC_LAST_SUCCESS_KEY,
            new Date(parsedTimestamp).toISOString()
        );

    }

    getFingerprint() {

        return this.storage.getItem(
            SYNC_FINGERPRINT_KEY
        ) ?? "";

    }

    getLastSuccess() {

        return this.storage.getItem(
            SYNC_LAST_SUCCESS_KEY
        ) ?? "";

    }

    hasPendingChanges(
        currentFingerprint
    ) {

        if (!this.isConfigured()) {
            return false;
        }

        const synchronizedFingerprint =
            this.getFingerprint();

        return (
            !synchronizedFingerprint ||
            synchronizedFingerprint !==
                currentFingerprint
        );

    }

    clearSyncState() {

        this.clearRevision();

        this.storage.removeItem(
            SYNC_FINGERPRINT_KEY
        );

        this.storage.removeItem(
            SYNC_LAST_SUCCESS_KEY
        );

    }

}
