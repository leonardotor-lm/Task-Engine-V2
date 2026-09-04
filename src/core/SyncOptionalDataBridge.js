import { TaskSort } from "./TaskSorting.js";
import {
    ProjectPinPreferences
} from "../infrastructure/ProjectPinPreferences.js";

const STARTED_FLAG =
    "__taskEngineOptionalSyncDataStarted";
const PROJECT_PIN_LIFECYCLE_FLAG =
    "__taskEngineProjectPinLifecycleStarted";

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
        this.projectPinPreferences =
            app?.projectPinPreferences ??
            new ProjectPinPreferences();

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

    validateProjectPinPreferences(preferences) {

        if (
            !preferences ||
            typeof preferences !== "object" ||
            Array.isArray(preferences)
        ) {
            throw new Error(
                "La copia contiene proyectos anclados inválidos."
            );
        }

        const normalized = {};

        for (
            const [projectId, pinned] of
            Object.entries(preferences)
        ) {

            if (
                !String(projectId).trim() ||
                pinned !== true
            ) {
                throw new Error(
                    "La copia contiene un proyecto anclado inválido."
                );
            }

            normalized[String(projectId).trim()] = true;

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

        const normalized = {};
        const sidebarTitle =
            preferences.sidebarTitle?.trim() ?? "";

        if (sidebarTitle) {
            normalized.sidebarTitle = sidebarTitle;
        }

        return normalized;

    }

    start() {

        this.wrapProjectPinLifecycle();

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
        this.wrapApplyOperations(
            backupService,
            sortPreferences,
            displayPreferences
        );

    }

    wrapProjectPinLifecycle() {

        const taskService = this.app?.taskService;

        if (
            !taskService ||
            taskService[PROJECT_PIN_LIFECYCLE_FLAG]
        ) {
            return;
        }

        taskService[PROJECT_PIN_LIFECYCLE_FLAG] = true;

        for (
            const methodName of [
                "updateTask",
                "completeTasks",
                "archiveTasks",
                "deleteTasks"
            ]
        ) {

            const original = taskService[methodName];

            if (typeof original !== "function") {
                continue;
            }

            taskService[methodName] = (...args) => {
                const result = original.apply(
                    taskService,
                    args
                );

                this.pruneProjectPins();

                return result;
            };

        }

    }

    pruneProjectPins() {

        const getActiveProjectRoots =
            this.app?.taskService
                ?.getActiveProjectRoots;

        if (typeof getActiveProjectRoots !== "function") {
            return;
        }

        this.projectPinPreferences.prune(
            getActiveProjectRoots
                .call(this.app.taskService)
                .map(project => project.id)
        );

    }

    getProjectPinPreferenceMap() {

        return Object.fromEntries(
            this.projectPinPreferences
                .getPinnedProjectIds()
                .map(projectId => [projectId, true])
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
                    projectPinPreferences:
                        this.getProjectPinPreferenceMap(),
                    displayPreferences: {
                        ...(sidebarTitle
                            ? { sidebarTitle }
                            : {})
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
            const hasProjectPinPreferences =
                hasOwn(
                    rawData,
                    "projectPinPreferences"
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

            data.projectPinPreferences =
                hasProjectPinPreferences
                    ? this.validateProjectPinPreferences(
                        rawData.projectPinPreferences
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

    wrapApplyOperations(
        backupService,
        sortPreferences,
        displayPreferences
    ) {

        const originalGetApplyOperations =
            backupService.getApplyOperations
                .bind(backupService);
        const sortRepository = {
            getAll: () =>
                sortPreferences.getAll(),
            replaceAll: preferences =>
                sortPreferences.replaceAll(
                    preferences,
                    { throwOnError: true }
                )
        };
        const pinRepository = {
            getAll: () =>
                this.getProjectPinPreferenceMap(),
            replaceAll: preferences =>
                this.projectPinPreferences.replaceAll(
                    Object.keys(preferences ?? {}),
                    { throwOnError: true }
                )
        };
        const displayRepository = {
            getAll: () => ({
                sidebarTitle:
                    displayPreferences
                        .getSidebarTitle()
            }),
            replaceAll: preferences =>
                displayPreferences.setSidebarTitle(
                    preferences?.sidebarTitle ?? ""
                )
        };

        backupService.getApplyOperations = data => {
            const normalizedData = {
                ...data,
                customFilters:
                    data.customFilters === null
                        ? (
                            backupService
                                .customFilterRepository
                                ?.getAll?.() ?? []
                        )
                        : data.customFilters
            };
            const operations =
                originalGetApplyOperations(
                    normalizedData
                );

            if (
                data.taskSortPreferences !== null &&
                data.taskSortPreferences !== undefined
            ) {
                operations.push([
                    sortRepository,
                    data.taskSortPreferences
                ]);
            }

            if (
                data.projectPinPreferences !== null &&
                data.projectPinPreferences !== undefined
            ) {
                operations.push([
                    pinRepository,
                    data.projectPinPreferences
                ]);
            }

            if (
                data.displayPreferences !== null &&
                data.displayPreferences !== undefined
            ) {
                operations.push([
                    displayRepository,
                    data.displayPreferences
                ]);
            }

            return operations;

        };

    }

}
