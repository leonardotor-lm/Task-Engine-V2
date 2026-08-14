const METADATA_STORAGE_KEY =
    "task-engine-v2-show-metadata";

const COMPLETED_STORAGE_KEY =
    "task-engine-v2-show-completed";

const SIDEBAR_TITLE_STORAGE_KEY =
    "task-engine-v2-sidebar-title";

const LEGACY_SIDEBAR_USER_NAME_STORAGE_KEY =
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

    getSidebarTitle() {

        const storedTitle = this.storage.getItem(
            SIDEBAR_TITLE_STORAGE_KEY
        );

        if (storedTitle !== null) {
            return storedTitle.trim();
        }

        const legacyTitle = (
            this.storage.getItem(
                LEGACY_SIDEBAR_USER_NAME_STORAGE_KEY
            ) || ""
        ).trim();

        if (legacyTitle) {
            this.storage.setItem(
                SIDEBAR_TITLE_STORAGE_KEY,
                legacyTitle
            );
        }

        return legacyTitle;

    }

    setSidebarTitle(title) {

        const normalizedTitle = String(title ?? "")
            .trim()
            .slice(0, 40);

        this.storage.setItem(
            SIDEBAR_TITLE_STORAGE_KEY,
            normalizedTitle
        );

        return normalizedTitle;

    }

}
