import { SyncConflictError } from "../infrastructure/CloudGateway.js";
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
        gateway
    }) {

        this.backupService = backupService;
        this.config = config;
        this.gateway = gateway;

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

        const response = await this.gateway.save({
            ...connection,
            baseRevision:
                this.config.getRevision(),
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

            const saved = await this.gateway.save({
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

        const saved = await this.gateway.save({
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

        const backup =
            this.backupService.createBackup();

        const response = await this.gateway.save({
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
            this.backupService.createBackup();

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
