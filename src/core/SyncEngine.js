import {
    SyncConflictError,
    SyncProtocolError
} from "../infrastructure/CloudGateway.js";
import {
    createIncrementalChanges
} from "./SyncChangeSet.js";
import {
    SyncBaseSnapshotRepository
} from "../infrastructure/SyncBaseSnapshotRepository.js";
import {
    PendingSyncChangesRepository
} from "../infrastructure/PendingSyncChangesRepository.js";
import {
    SyncMetricsRepository
} from "../infrastructure/SyncMetricsRepository.js";
import { createSyncFingerprint } from "./SyncFingerprint.js";
import {
    createSafeMergedSyncBackup
} from "./SyncBackupMerger.js";
import {
    getSyncReconnectionAction,
    SyncReconnectionAction
} from "./SyncReconnectionPolicy.js";

export class SyncEngine {

    constructor({
        backupService,
        config,
        gateway,
        baseSnapshotRepository =
            new SyncBaseSnapshotRepository(),
        pendingChangesRepository =
            new PendingSyncChangesRepository(),
        metricsRepository =
            new SyncMetricsRepository()
    }) {

        this.backupService = backupService;
        this.config = config;
        this.gateway = gateway;
        this.baseSnapshotRepository =
            baseSnapshotRepository;
        this.pendingChangesRepository =
            pendingChangesRepository;
        this.metricsRepository = metricsRepository;
        this.remoteWriteOutcomeUncertain = false;

    }

    capturePendingChanges(backup = null) {
        if (!this.config.isConfigured()) return null;

        const connection = this.config.get();
        const base = this.baseSnapshotRepository.get(
            connection.url
        );

        if (!base) {
            this.pendingChangesRepository.clear();
            return null;
        }

        const changes = createIncrementalChanges(
            base,
            backup ?? this.backupService.createBackup()
        );

        return this.pendingChangesRepository.replace({
            endpoint: connection.url,
            baseRevision: this.config.getRevision(),
            changes
        });
    }

    rememberMetric(metric) {
        this.metricsRepository.add(metric);
        console.info("Task Engine sync", metric);
    }

    ensureConfigured() {

        if (!this.config.isConfigured()) {
            throw new Error(
                "Configurá la sincronización antes de continuar."
            );
        }

        return this.config.get();

    }

    validateRevision(revision) {

        if (
            !Number.isInteger(revision) ||
            revision < 0
        ) {
            throw new Error(
                "El servidor devolvió una revisión inválida."
            );
        }

        return revision;

    }

    summarize(data) {

        return {
            tasks: data.tasks.length,
            areas: data.areas.length,
            contexts: data.contexts.length,
            tags: data.tags.length,
            goals: (data.goals ?? []).length,
            activityEvents:
                (data.activityEvents ?? []).length
        };

    }

    async saveRemote(payload) {

        try {

            const response =
                await this.gateway.save(payload);

            this.remoteWriteOutcomeUncertain = false;

            return response;

        } catch (error) {

            if (!this.isConflict(error)) {
                this.remoteWriteOutcomeUncertain = true;
            }

            throw error;

        }

    }

    async saveRemoteIncremental(payload) {
        try {
            const response =
                await this.gateway.saveIncremental(payload);
            this.remoteWriteOutcomeUncertain = false;
            return response;
        } catch (error) {
            if (!this.isConflict(error)) {
                this.remoteWriteOutcomeUncertain = true;
            }
            throw error;
        }
    }

    async reconcileUncertainPush(
        connection,
        backup
    ) {

        if (!this.remoteWriteOutcomeUncertain) {
            return null;
        }

        const response = await this.gateway.load(
            connection
        );
        const remoteRevision =
            this.validateRevision(response.revision);
        const localRevision =
            this.config.getRevision();

        if (remoteRevision === localRevision) {
            this.remoteWriteOutcomeUncertain = false;
            return null;
        }

        if (remoteRevision < localRevision) {
            throw new Error(
                "La revisión remota es anterior a la revisión local confirmada."
            );
        }

        const localFingerprint =
            createSyncFingerprint(backup);
        const remoteFingerprint =
            response.data === null
                ? null
                : createSyncFingerprint(
                    response.data
                );

        if (
            remoteFingerprint !== null &&
            remoteFingerprint === localFingerprint
        ) {
            this.config.setRevision(
                remoteRevision
            );
            this.config.markSynchronized(
                localFingerprint
            );
            this.pendingChangesRepository.clear();
            this.remoteWriteOutcomeUncertain = false;

            return {
                revision: remoteRevision,
                summary: this.summarize(
                    this.backupService
                        .parseAndValidate(
                            JSON.stringify(backup)
                        )
                )
            };
        }

        throw new SyncConflictError(
            "La nube cambió mientras se verificaba una sincronización anterior.",
            remoteRevision
        );

    }

    async inspectRemote() {

        const connection =
            this.ensureConfigured();

        const response = await this.gateway.load(
            connection
        );

        const revision = this.validateRevision(
            response.revision
        );

        if (response.data === null) {

            return {
                revision,
                empty: true,
                summary: {
                    tasks: 0,
                    areas: 0,
                    contexts: 0,
                    tags: 0,
                    goals: 0,
                    activityEvents: 0
                }
            };

        }

        const data =
            this.backupService.parseAndValidate(
                JSON.stringify(response.data)
            );

        return {
            revision,
            empty: false,
            summary: this.summarize(data)
        };

    }

    async push() {

        const connection =
            this.ensureConfigured();

        const backup =
            this.backupService.createBackup();

        const reconciled =
            await this.reconcileUncertainPush(
                connection,
                backup
            );

        if (reconciled) {
            return reconciled;
        }

        const pending = this.capturePendingChanges(backup);
        const fullRequest = {
            ...connection,
            baseRevision: this.config.getRevision(),
            data: backup
        };
        let response;
        let mode = "full";
        let changeCount = null;
        let requestBytes = JSON.stringify(fullRequest).length;

        if (
            pending &&
            pending.baseRevision ===
                this.config.getRevision()
        ) {
            const incrementalRequest = {
                ...connection,
                baseRevision: pending.baseRevision,
                changes: pending.changes
            };

            try {
                response = await this
                    .saveRemoteIncremental(
                        incrementalRequest
                    );
                mode = "incremental";
                changeCount = pending.changes.length;
                requestBytes = JSON.stringify(
                    incrementalRequest
                ).length;
            } catch (error) {
                if (
                    !(error instanceof SyncProtocolError) ||
                    ![
                        "UNKNOWN_ACTION",
                        "INVALID_ACTION",
                        "FULL_SNAPSHOT_REQUIRED"
                    ].includes(error.code)
                ) {
                    throw error;
                }
                response = await this.saveRemote(fullRequest);
            }
        } else {
            response = await this.saveRemote(fullRequest);
        }

        const revision = this.validateRevision(
            response.revision
        );

        this.config.setRevision(revision);
        this.config.markSynchronized(
            createSyncFingerprint(backup)
        );
        this.pendingChangesRepository.clear();
        this.rememberMetric({
            mode,
            changeCount,
            requestBytes,
            fullSnapshotBytes:
                JSON.stringify(fullRequest).length,
            savedBytes:
                Math.max(
                    0,
                    JSON.stringify(fullRequest).length -
                        requestBytes
                ),
            serverRowsWritten:
                response.rowsWritten ?? null,
            revision
        });

        return {
            revision,
            syncMode: mode,
            changeCount,
            requestBytes,
            summary: this.summarize(
                this.backupService
                    .parseAndValidate(
                        JSON.stringify(backup)
                    )
            )
        };

    }

    async checkRemoteRevision() {

        const connection =
            this.ensureConfigured();

        const response = await this.gateway.load(
            connection
        );

        const remoteRevision =
            this.validateRevision(
                response.revision
            );

        const localRevision =
            this.config.getRevision();

        return {
            localRevision,
            remoteRevision,
            updateAvailable:
                remoteRevision > localRevision
        };

    }

    async reconcileUnknownConnection() {

        const connection =
            this.ensureConfigured();
        const localBackup =
            this.backupService.createBackup();
        const localData =
            this.backupService.parseAndValidate(
                JSON.stringify(localBackup)
            );

        const remoteResponse =
            await this.gateway.load(connection);
        const remoteRevision =
            this.validateRevision(
                remoteResponse.revision
            );
        const remoteBackup =
            remoteResponse.data;
        const remoteData = remoteBackup === null
            ? null
            : this.backupService
                .parseAndValidate(
                    JSON.stringify(remoteBackup)
                );

        this.remoteWriteOutcomeUncertain = false;

        const action =
            getSyncReconnectionAction({
                localBackup,
                remoteBackup
            });

        if (
            action ===
                SyncReconnectionAction.CONFLICT
        ) {
            return {
                action,
                revision: remoteRevision,
                localSummary:
                    this.summarize(localData),
                remoteSummary:
                    this.summarize(remoteData)
            };
        }

        if (
            action ===
                SyncReconnectionAction.IDENTICAL
        ) {

            this.config.setRevision(
                remoteRevision
            );
            this.config.markSynchronized(
                createSyncFingerprint(localBackup)
            );

            return {
                action,
                revision: remoteRevision,
                summary: this.summarize(localData)
            };

        }

        if (
            action ===
                SyncReconnectionAction.PULL
        ) {

            this.ensureRemoteGoalsAreSafe(
                remoteBackup
            );

            this.backupService.importBackup(
                JSON.stringify(remoteBackup)
            );

            const importedBackup =
                this.backupService.createBackup();

            this.config.setRevision(
                remoteRevision
            );
            this.config.markSynchronized(
                createSyncFingerprint(
                    importedBackup
                )
            );

            return {
                action,
                revision: remoteRevision,
                summary: this.summarize(
                    remoteData
                )
            };

        }

        if (
            action ===
                SyncReconnectionAction.MERGE
        ) {

            const mergedBackup =
                createSafeMergedSyncBackup({
                    localBackup,
                    remoteBackup
                });

            if (!mergedBackup) {
                return {
                    action:
                        SyncReconnectionAction.CONFLICT,
                    revision: remoteRevision,
                    localSummary:
                        this.summarize(localData),
                    remoteSummary:
                        this.summarize(remoteData)
                };
            }

            const mergedData =
                this.backupService
                    .parseAndValidate(
                        JSON.stringify(mergedBackup)
                    );

            const saved = await this.saveRemote({
                ...connection,
                baseRevision: remoteRevision,
                data: mergedBackup
            });
            const revision = this.validateRevision(
                saved.revision
            );

            this.backupService.importBackup(
                JSON.stringify(mergedBackup)
            );

            const normalizedMergedBackup =
                this.backupService.createBackup();

            this.config.setRevision(revision);
            this.config.markSynchronized(
                createSyncFingerprint(
                    normalizedMergedBackup
                )
            );

            return {
                action,
                revision,
                summary: this.summarize(
                    mergedData
                )
            };

        }

        const saved = await this.saveRemote({
            ...connection,
            baseRevision: remoteRevision,
            data: localBackup
        });
        const revision = this.validateRevision(
            saved.revision
        );

        this.config.setRevision(revision);
        this.config.markSynchronized(
            createSyncFingerprint(localBackup)
        );

        return {
            action,
            revision,
            summary: this.summarize(localData)
        };

    }

    async overwriteRemote() {

        const connection =
            this.ensureConfigured();

        const currentRemote =
            await this.gateway.load(connection);

        const baseRevision =
            this.validateRevision(
                currentRemote.revision
            );

        this.remoteWriteOutcomeUncertain = false;

        const backup =
            this.backupService.createBackup();

        const response = await this.saveRemote({
            ...connection,
            baseRevision,
            data: backup
        });

        const revision = this.validateRevision(
            response.revision
        );

        this.config.setRevision(revision);
        this.config.markSynchronized(
            createSyncFingerprint(backup)
        );

        return {
            revision,
            summary: this.summarize(
                this.backupService
                    .parseAndValidate(
                        JSON.stringify(backup)
                    )
            )
        };

    }

    async pull() {

        const connection =
            this.ensureConfigured();

        const response = await this.gateway.load(
            connection
        );

        const revision = this.validateRevision(
            response.revision
        );

        if (response.data === null) {
            throw new Error(
                "Todavía no hay datos guardados en la nube."
            );
        }

        this.ensureRemoteGoalsAreSafe(
            response.data
        );

        const data =
            this.backupService.parseAndValidate(
                JSON.stringify(response.data)
            );

        this.backupService.importBackup(
            JSON.stringify(response.data)
        );

        const importedBackup =
            typeof this.backupService.createBackup ===
                "function"
                ? this.backupService.createBackup()
                : response.data;

        this.config.setRevision(revision);
        this.config.markSynchronized(
            createSyncFingerprint(
                importedBackup
            )
        );

        return {
            revision,
            summary: this.summarize(data)
        };

    }

    ensureRemoteGoalsAreSafe(remoteBackup) {

        const remoteGoals =
            remoteBackup?.data?.goals;

        if (Array.isArray(remoteGoals)) {
            return;
        }

        if (
            typeof this.backupService
                .createBackup !== "function"
        ) {
            return;
        }

        const localBackup =
            this.backupService.createBackup();

        const localGoals =
            localBackup?.data?.goals;

        if (
            Array.isArray(localGoals) &&
            localGoals.length > 0
        ) {
            throw new Error(
                "La nube usa una versión anterior que no admite objetivos. Actualizá Google Apps Script antes de descargar."
            );
        }

    }

    isConflict(error) {

        return error instanceof SyncConflictError;

    }

}
