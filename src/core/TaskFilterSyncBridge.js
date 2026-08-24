const STARTED_FLAG =
    "__taskEngineTaskFilterSyncStarted";

function hasOwn(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object ?? {},
        property
    );

}

export class TaskFilterSyncBridge {

    constructor(app) {

        this.app = app;

    }

    start() {

        const backupService =
            this.app?.backupService;
        const repository =
            this.app?.taskFilterPreferencesRepository;

        if (
            !backupService ||
            !repository ||
            backupService[STARTED_FLAG]
        ) {
            return;
        }

        backupService[STARTED_FLAG] = true;

        this.wrapCreateBackup(
            backupService,
            repository
        );
        this.wrapParseAndValidate(
            backupService,
            repository
        );
        this.wrapApplyOperations(
            backupService,
            repository
        );

    }

    wrapCreateBackup(
        backupService,
        repository
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
                    taskFilterPreferences:
                        repository.getAll()
                }
            };

        };

    }

    wrapParseAndValidate(
        backupService,
        repository
    ) {

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
            const hasPreferences =
                hasOwn(
                    rawData,
                    "taskFilterPreferences"
                );

            if (
                hasPreferences &&
                (
                    !rawData.taskFilterPreferences ||
                    typeof rawData.taskFilterPreferences !==
                        "object" ||
                    Array.isArray(
                        rawData.taskFilterPreferences
                    )
                )
            ) {
                throw new Error(
                    "La copia contiene preferencias de filtros rápidos inválidas."
                );
            }

            const data =
                originalParseAndValidate(json);

            data.taskFilterPreferences =
                hasPreferences
                    ? repository.normalizeAll(
                        rawData.taskFilterPreferences
                    )
                    : null;

            return data;

        };

    }

    wrapApplyOperations(
        backupService,
        repository
    ) {

        if (
            typeof backupService.getApplyOperations ===
            "function"
        ) {
            const originalGetApplyOperations =
                backupService.getApplyOperations
                    .bind(backupService);

            backupService.getApplyOperations = data => {
                const operations =
                    originalGetApplyOperations(data);

                if (
                    data.taskFilterPreferences !== null &&
                    data.taskFilterPreferences !== undefined
                ) {
                    operations.push([
                        repository,
                        data.taskFilterPreferences
                    ]);
                }

                return operations;
            };

            return;
        }

        this.wrapLegacyApplyData(
            backupService,
            repository
        );

    }

    wrapLegacyApplyData(
        backupService,
        repository
    ) {

        const originalApplyData =
            backupService.applyData
                .bind(backupService);

        backupService.applyData = data => {

            originalApplyData(data);

            if (
                data.taskFilterPreferences !== null &&
                data.taskFilterPreferences !== undefined
            ) {
                repository.replaceAll(
                    data.taskFilterPreferences
                );
            }

        };

    }

}
