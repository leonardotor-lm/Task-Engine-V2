const STORAGE_KEY =
    "task-engine-v2-show-metadata";

export class TaskDisplayPreferences {

    constructor(storage = localStorage) {

        this.storage = storage;

    }

    isMetadataVisible() {

        return this.storage.getItem(
            STORAGE_KEY
        ) !== "false";

    }

    toggleMetadata() {

        const visible =
            !this.isMetadataVisible();

        this.storage.setItem(
            STORAGE_KEY,
            String(visible)
        );

        return visible;

    }

}
