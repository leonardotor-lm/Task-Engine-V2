const AI_ENABLED_STORAGE_KEY =
    "task-engine-v2-ai-enabled";

export class AiPreferences {

    constructor(storage = localStorage) {
        this.storage = storage;
    }

    isEnabled() {
        return this.storage.getItem(
            AI_ENABLED_STORAGE_KEY
        ) === "true";
    }

    setEnabled(enabled) {
        const normalized = enabled === true;

        this.storage.setItem(
            AI_ENABLED_STORAGE_KEY,
            String(normalized)
        );

        return normalized;
    }

}
