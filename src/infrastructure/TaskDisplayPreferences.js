const METADATA_STORAGE_KEY =
    "task-engine-v2-show-metadata";

const COMPLETED_STORAGE_KEY =
    "task-engine-v2-show-completed";

const SIDEBAR_USER_NAME_STORAGE_KEY =
    "task-engine-v2-sidebar-user-name";

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

    getSidebarUserName() {

        return (
            this.storage.getItem(
                SIDEBAR_USER_NAME_STORAGE_KEY
            ) || ""
        ).trim();

    }

    setSidebarUserName(name) {

        const normalizedName = String(name ?? "")
            .trim()
            .slice(0, 40);

        this.storage.setItem(
            SIDEBAR_USER_NAME_STORAGE_KEY,
            normalizedName
        );

        return normalizedName;

    }

}
