const METADATA_METADATA_STORAGE_KEY =
    "task-engine-v2-show-metadata";

const COMPLETED_METADATA_STORAGE_KEY =
    "task-engine-v2-show-completed";

export class TaskDisplayPreferences {

    constructor(storage = localStorage) {

        this.storage = storage;

    }

    isMetadataVisible() {

        return this.storage.getItem(
            METADATA_STORAGE_KEY
        ) !== "false";

    }

    toggleMetadata() {

        const visible =
            !this.isMetadataVisible();

        this.storage.setItem(
            METADATA_STORAGE_KEY,
            String(visible)
        );

        return visible;

    }

    areCompletedTasksVisible() {

        return this.storage.getItem(
            COMPLETED_STORAGE_KEY
        ) === "true";

    }

    toggleCompletedTasks() {

        const visible =
            !this.areCompletedTasksVisible();

        this.storage.setItem(
            COMPLETED_STORAGE_KEY,
            String(visible)
        );

        return visible;

    }

}
