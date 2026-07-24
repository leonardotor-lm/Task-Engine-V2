import { SyncConflictError } from "../infrastructure/CloudGateway.js";
import { createSyncFingerprint } from "./SyncFingerprint.js";

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
            tags: data.tags.length
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
                    tags: 0
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

        const data =
            this.backupService.parseAndValidate(
                JSON.stringify(response.data)
            );

        this.backupService.importBackup(
            JSON.stringify(response.data)
        );

        this.config.setRevision(revision);
        this.config.markSynchronized(
            createSyncFingerprint(
                response.data
            )
        );

        return {
            revision,
            summary: this.summarize(data)
        };

    }

    isConflict(error) {

        return error instanceof SyncConflictError;

    }

}
