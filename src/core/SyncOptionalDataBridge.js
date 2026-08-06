import { TaskSort } from "./TaskSorting.js";

const STARTED_FLAG =
    "__taskEngineOptionalSyncDataStarted";

const VALID_SORTS = new Set(
    Object.values(TaskSort)
);

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

    start() {

        const backupService =
            this.app?.backupService;
        const sortPreferences =
            this.app?.taskSortPreferencesRepository;

        if (
            !backupService ||
            !sortPreferences ||
            backupService[STARTED_FLAG]
        ) {
            return;
        }

        backupService[STARTED_FLAG] = true;

        this.wrapCreateBackup(
            backupService,
            sortPreferences
        );
        this.wrapParseAndValidate(
            backupService
        );
        this.wrapApplyData(
            backupService,
            sortPreferences
        );

    }

    wrapCreateBackup(
        backupService,
        sortPreferences
    ) {

        const originalCreateBackup =
            backupService.createBackup
                .bind(backupService);

        backupService.createBackup = () => {

            const backup = originalCreateBackup();

            return {
                ...backup,
                data: {
                    ...backup.data,
                    taskSortPreferences:
                        sortPreferences.getAll()
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

            return data;

        };

    }

    wrapApplyData(
        backupService,
        sortPreferences
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

        };

    }

}
