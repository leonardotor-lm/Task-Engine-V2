import {
    createSyncFingerprint
} from "../core/SyncFingerprint.js";
import {
    createSafeMergedSyncBackup
} from "../core/SyncBackupMerger.js";
import {
    createThreeWayMergedSyncBackup
} from "../core/SyncThreeWayMerger.js";
import {
    createSyncConflictDiagnostics
} from "../core/SyncConflictDiagnostics.js";
import {
    SyncBaseSnapshotRepository
} from "../infrastructure/SyncBaseSnapshotRepository.js";

export class OngoingSyncReconciliationController {

    constructor(
        app,
        {
            repository = null,
            storage = globalThis.localStorage
        } = {}
    ) {

        this.app = app;
        this.repository =
            repository ??
            new SyncBaseSnapshotRepository(
                storage
            );
        this.started = false;
        this.reconciling = false;

    }

    start() {

        if (
            this.started ||
            !this.app ||
            typeof this.app.checkRemoteStatus !==
                "function"
        ) {
            return;
        }

        this.started = true;
        this.app.syncBaseSnapshotRepository =
            this.repository;

        this.wrapSuccessfulSyncOperations();
        this.wrapRemoteCheck();

    }

    getEndpoint() {

        return this.app.syncConfig
            ?.get?.().url ?? "";

    }

    rememberCurrentBase() {

        if (!this.app.syncConfig?.isConfigured?.()) {
            return;
        }

        this.repository.set(
            this.app.backupService.createBackup(),
            this.getEndpoint()
        );

    }

    wrapSuccessfulSyncOperations() {

        const engine = this.app.syncEngine;

        for (
            const method of [
                "push",
                "pull",
                "overwriteRemote",
                "reconcileUnknownConnection"
            ]
        ) {

            if (typeof engine?.[method] !== "function") {
                continue;
            }

            const original =
                engine[method].bind(engine);

            engine[method] = async (...args) => {

                const result = await original(...args);

                if (result?.action !== "CONFLICT") {
                    this.rememberCurrentBase();
                }

                return result;

            };

        }

    }

    wrapRemoteCheck() {

        const originalCheckRemoteStatus =
            this.app.checkRemoteStatus
                .bind(this.app);

        this.app.checkRemoteStatus = async (...args) => {

            const result =
                await originalCheckRemoteStatus(...args);

            if (this.shouldReconcileKnownChanges()) {
                return this.reconcileKnownChanges();
            }

            return result;

        };

    }

    shouldReconcileKnownChanges() {

        if (this.reconciling) return false;

        const config = this.app.syncConfig;

        if (
            !config?.isConfigured?.() ||
            !config?.hasKnownSyncState?.() ||
            !this.app.syncRemoteUpdateAvailable
        ) {
            return false;
        }

        try {
            return config.hasPendingChanges(
                this.app.getCurrentSyncFingerprint()
            );
        } catch {
            return false;
        }

    }

    async saveMergedBackup(
        mergedBackup,
        remoteRevision
    ) {

        const connection =
            this.app.syncConfig.get();

        this.app.backupService
            .parseAndValidate(
                JSON.stringify(mergedBackup)
            );

        const saved =
            await this.app.syncEngine.gateway.save({
                ...connection,
                baseRevision: remoteRevision,
                data: mergedBackup
            });

        const revision =
            this.app.syncEngine.validateRevision(
                saved.revision
            );

        this.app.backupService.importBackup(
            JSON.stringify(mergedBackup)
        );

        const normalized =
            this.app.backupService.createBackup();

        this.app.syncConfig.setRevision(revision);
        this.app.syncConfig.markSynchronized(
            createSyncFingerprint(normalized)
        );
        this.repository.set(
            normalized,
            connection.url
        );

        return {
            revision,
            backup: normalized
        };

    }

    async resolveWithoutStoredBase({
        localBackup,
        remoteBackup,
        remoteRevision
    }) {

        const synchronizedFingerprint =
            this.app.syncConfig.getFingerprint();
        const localFingerprint =
            createSyncFingerprint(localBackup);
        const remoteFingerprint =
            createSyncFingerprint(remoteBackup);

        if (
            synchronizedFingerprint &&
            synchronizedFingerprint ===
                localFingerprint
        ) {
            return this.app.syncEngine.pull();
        }

        if (
            synchronizedFingerprint &&
            synchronizedFingerprint ===
                remoteFingerprint
        ) {
            return this.app.syncEngine
                .overwriteRemote();
        }

        const mergedBackup =
            createSafeMergedSyncBackup({
                localBackup,
                remoteBackup
            });

        if (!mergedBackup) {
            return null;
        }

        return this.saveMergedBackup(
            mergedBackup,
            remoteRevision
        );

    }

    async reconcileKnownChanges() {

        if (this.reconciling) return null;

        this.reconciling = true;
        this.app.autoSyncInProgress = true;
        this.app.syncLastError = null;
        this.app.render({
            preserveTransientUi: true
        });

        try {

            const connection =
                this.app.syncConfig.get();
            const localBackup =
                this.app.backupService
                    .createBackup();
            const remoteResponse =
                await this.app.syncEngine
                    .gateway.load(connection);
            const remoteRevision =
                this.app.syncEngine
                    .validateRevision(
                        remoteResponse.revision
                    );
            const remoteBackup =
                remoteResponse.data;

            if (!remoteBackup?.data) {

                const result =
                    await this.app.syncEngine
                        .overwriteRemote();

                this.app.syncRemoteRevision =
                    result.revision;
                this.app.syncRemoteUpdateAvailable =
                    false;
                this.app.syncConflictDetails = [];

                return result;

            }

            const localFingerprint =
                createSyncFingerprint(localBackup);
            const remoteFingerprint =
                createSyncFingerprint(remoteBackup);

            if (localFingerprint === remoteFingerprint) {

                this.app.syncConfig.setRevision(
                    remoteRevision
                );
                this.app.syncConfig.markSynchronized(
                    localFingerprint
                );
                this.repository.set(
                    localBackup,
                    connection.url
                );

                this.app.syncRemoteRevision =
                    remoteRevision;
                this.app.syncRemoteUpdateAvailable =
                    false;
                this.app.syncConflictDetails = [];

                return {
                    action: "IDENTICAL",
                    revision: remoteRevision
                };

            }

            const baseBackup =
                this.repository.get(
                    connection.url
                );

            let result;
            let conflicts = [];

            if (baseBackup) {

                const merged =
                    createThreeWayMergedSyncBackup({
                        baseBackup,
                        localBackup,
                        remoteBackup
                    });

                conflicts = merged.conflicts;

                result = merged.backup
                    ? await this.saveMergedBackup(
                        merged.backup,
                        remoteRevision
                    )
                    : null;

            } else {

                result =
                    await this.resolveWithoutStoredBase({
                        localBackup,
                        remoteBackup,
                        remoteRevision
                    });

            }

            if (!result) {

                this.app.syncRemoteRevision =
                    remoteRevision;
                this.app.syncRemoteUpdateAvailable =
                    true;
                this.app.syncLastError = null;
                this.app.autoSyncBlockedFingerprint =
                    localFingerprint;

                this.app.syncConflictDetails =
                    conflicts.length > 0
                        ? conflicts.map(conflict =>
                            `Cambio incompatible: ${conflict}`
                        )
                        : createSyncConflictDiagnostics({
                            localBackup,
                            remoteBackup
                        });

                return {
                    action: "CONFLICT",
                    revision: remoteRevision,
                    conflicts:
                        this.app.syncConflictDetails
                };

            }

            this.app.syncRemoteRevision =
                result.revision;
            this.app.syncRemoteUpdateAvailable =
                false;
            this.app.autoSyncBlockedFingerprint =
                null;
            this.app.syncConflictDetails = [];
            this.app.syncLastError = null;

            return {
                action: "MERGE",
                revision: result.revision
            };

        } catch (error) {

            this.app.syncLastError =
                error?.message ||
                "No se pudieron reconciliar los cambios automáticamente.";

            console.warn(
                "No se pudieron reconciliar los cambios automáticamente.",
                error
            );

            return null;

        } finally {

            this.reconciling = false;
            this.app.autoSyncInProgress = false;
            this.app.syncCheckInProgress = false;
            this.app.render({
                preserveTransientUi: true
            });

        }

    }

}
