import { TaskSort } from "./TaskSorting.js";

const STARTED_FLAG =
    "__taskEngineOptionalSyncDataStarted";

const VALID_SORTS = new Set(
    Object.values(TaskSort)
);

const VALID_THEMES = new Set([
    "default",
    "dark",
    "retro-dark",
    "muestrario"
]);

function hasOwn(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object ?? {},
        property
    );

}

export class SyncOptionalDataBridge {

    constructor(app) {

        this.app = app;

    }

    validateTaskSortPreferences(preferences) {

        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            throw new Error(
                "La copia contiene preferencias de orden inválidas."
            );
        }

        const normalized = {};

        for (
            const [viewKey, sort] of
            Object.entries(preferences)
        ) {

            if (
                typeof viewKey !== "string" ||
                !viewKey.trim() ||
                !VALID_SORTS.has(sort)
            ) {
                throw new Error(
                    "La copia contiene una preferencia de orden inválida."
                );
            }

            normalized[viewKey] = sort;

        }

        return normalized;

    }

    validateDisplayPreferences(preferences) {

        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            throw new Error(
                "La copia contiene preferencias de visualización inválidas."
            );
        }

        if (
            hasOwn(preferences, "sidebarTitle") &&
            (
                typeof preferences.sidebarTitle !==
                    "string" ||
                preferences.sidebarTitle.trim().length >
                    40
            )
        ) {
            throw new Error(
                "La copia contiene un título lateral inválido."
            );
        }

        if (
            hasOwn(preferences, "theme") &&
            !VALID_THEMES.has(preferences.theme)
        ) {
            throw new Error(
                "La copia contiene un tema visual inválido."
            );
        }

        const normalized = {};
        const sidebarTitle =
            preferences.sidebarTitle?.trim() ?? "";

        if (sidebarTitle) {
            normalized.sidebarTitle = sidebarTitle;
        }

        if (hasOwn(preferences, "theme")) {
            normalized.theme = preferences.theme;
        }

        return normalized;

    }

    start() {

        const backupService =
            this.app?.backupService;
        const sortPreferences =
            this.app?.taskSortPreferencesRepository;
        const displayPreferences =
            this.app?.taskDisplayPreferences;

        if (
            !backupService ||
            !sortPreferences ||
            !displayPreferences ||
            backupService[STARTED_FLAG]
        ) {
            return;
        }

        backupService[STARTED_FLAG] = true;

        this.wrapCreateBackup(
            backupService,
            sortPreferences,
            displayPreferences
        );
        this.wrapParseAndValidate(
            backupService
        );
        this.wrapApplyData(
            backupService,
            sortPreferences,
            displayPreferences
        );

    }

    wrapCreateBackup(
        backupService,
        sortPreferences,
        displayPreferences
    ) {

        const originalCreateBackup =
            backupService.createBackup
                .bind(backupService);

        backupService.createBackup = () => {

            const backup = originalCreateBackup();
            const sidebarTitle =
                displayPreferences.getSidebarTitle();

            return {
                ...backup,
                data: {
                    ...backup.data,
                    taskSortPreferences:
                        sortPreferences.getAll(),
                    displayPreferences: {
                        ...(sidebarTitle
                            ? { sidebarTitle }
                            : {}),
                        theme:
                            displayPreferences.getTheme()
                    }
                }
            };

        };

    }

    wrapParseAndValidate(backupService) {

        const originalParseAndValidate =
            backupService.parseAndValidate
                .bind(backupService);

        backupService.parseAndValidate = json => {

            let rawBackup;

            try {
                rawBackup = JSON.parse(json);
            } catch {
                return originalParseAndValidate(json);
            }

            const rawData = rawBackup?.data;
            const hasCustomFilters =
                hasOwn(rawData, "customFilters");
            const hasTaskSortPreferences =
                hasOwn(
                    rawData,
                    "taskSortPreferences"
                );
            const hasDisplayPreferences =
                hasOwn(
                    rawData,
                    "displayPreferences"
                );

            if (
                hasCustomFilters &&
                !Array.isArray(
                    rawData.customFilters
                )
            ) {
                throw new Error(
                    "La copia contiene una colección inválida de filtros personalizados."
                );
            }

            const data =
                originalParseAndValidate(json);

            data.customFilters =
                hasCustomFilters
                    ? data.customFilters
                    : null;

            data.taskSortPreferences =
                hasTaskSortPreferences
                    ? this.validateTaskSortPreferences(
                        rawData.taskSortPreferences
                    )
                    : null;

            data.displayPreferences =
                hasDisplayPreferences
                    ? this.validateDisplayPreferences(
                        rawData.displayPreferences
                    )
                    : null;

            return data;

        };

    }

    wrapApplyData(
        backupService,
        sortPreferences,
        displayPreferences
    ) {

        const originalApplyData =
            backupService.applyData
                .bind(backupService);

        backupService.applyData = data => {

            const preservedCustomFilters =
                data.customFilters === null
                    ? (
                        backupService
                            .customFilterRepository
                            ?.getAll?.() ?? []
                    )
                    : data.customFilters;

            originalApplyData({
                ...data,
                customFilters:
                    preservedCustomFilters
            });

            if (
                data.taskSortPreferences !== null &&
                data.taskSortPreferences !== undefined
            ) {
                sortPreferences.replaceAll(
                    data.taskSortPreferences
                );
            }

            if (
                data.displayPreferences !== null &&
                data.displayPreferences !== undefined
            ) {
                displayPreferences.setSidebarTitle(
                    data.displayPreferences
                        .sidebarTitle ?? ""
                );

                if (
                    hasOwn(
                        data.displayPreferences,
                        "theme"
                    )
                ) {
                    displayPreferences.setTheme(
                        data.displayPreferences.theme
                    );
                }
            }

        };

    }

}
