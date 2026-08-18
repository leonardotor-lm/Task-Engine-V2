import {
    NotionSyncRetryRepository
} from "../infrastructure/NotionSyncRetryRepository.js";

export class NotionSyncRetryController {

    constructor(
        app,
        {
            repository = null,
            storage = globalThis.localStorage,
            windowRef = globalThis.window,
            documentRef = globalThis.document
        } = {}
    ) {
        this.app = app;
        this.repository = repository ??
            new NotionSyncRetryRepository(storage);
        this.window = windowRef;
        this.document = documentRef;
        this.started = false;
        this.retrying = false;
        this.originalMethods = new Map();
    }

    start() {

        if (this.started) return;
        this.started = true;

        this.wrapGatewayMethod(
            "updateNotionTaskPage",
            "task"
        );
        this.wrapGatewayMethod(
            "updateNotionGoalPage",
            "goal"
        );

        this.window?.addEventListener?.(
            "online",
            () => this.retryPending()
        );
        this.window?.addEventListener?.(
            "focus",
            () => this.retryPending()
        );
        this.document?.addEventListener?.(
            "visibilitychange",
            () => {
                if (this.document.visibilityState === "visible") {
                    this.retryPending();
                }
            }
        );

        this.publishState();
        Promise.resolve().then(
            () => this.retryPending()
        );

    }

    wrapGatewayMethod(methodName, kind) {

        const gateway = this.app?.syncEngine?.gateway;
        const original = gateway?.[methodName];

        if (typeof original !== "function") return;

        const bound = original.bind(gateway);
        this.originalMethods.set(methodName, bound);

        gateway[methodName] = async args => {

            const operation = this.createOperation(
                kind,
                args
            );

            try {
                const result = await bound(args);
                if (operation) {
                    this.repository.remove(operation.key);
                    this.publishState();
                }
                return result;
            } catch (error) {
                if (operation) {
                    this.repository.upsert({
                        ...operation,
                        attempts: (
                            this.repository.list().find(
                                item => item.key === operation.key
                            )?.attempts ?? 0
                        ) + 1,
                        lastError: error?.message ||
                            "Error desconocido."
                    });
                    this.publishState();
                }
                throw error;
            }

        };

    }

    createOperation(kind, args = {}) {

        const payload = kind === "goal"
            ? args.goal
            : args.task;
        const entityId = payload?.id;
        const pageId = args.pageId;

        if (!entityId || !pageId || !payload) {
            return null;
        }

        return {
            key: `${kind}:${entityId}`,
            kind,
            entityId,
            pageId,
            payload
        };

    }

    async retryPending() {

        if (
            this.retrying ||
            !this.app?.syncConfig?.isConfigured?.()
        ) {
            return;
        }

        const pending = this.repository.list();
        if (pending.length === 0) {
            this.publishState();
            return;
        }

        this.retrying = true;
        const connection = this.app.syncConfig.get();

        try {

            for (const operation of pending) {

                const methodName = operation.kind === "goal"
                    ? "updateNotionGoalPage"
                    : "updateNotionTaskPage";
                const original =
                    this.originalMethods.get(methodName);

                if (!original) continue;

                const args = {
                    ...connection,
                    pageId: operation.pageId,
                    [operation.kind === "goal"
                        ? "goal"
                        : "task"]: operation.payload
                };

                try {
                    await original(args);
                    this.repository.remove(operation.key);
                } catch (error) {
                    this.repository.upsert({
                        ...operation,
                        attempts: Number(
                            operation.attempts ?? 0
                        ) + 1,
                        lastError: error?.message ||
                            "Error desconocido."
                    });
                }

            }

        } finally {
            this.retrying = false;
            this.publishState();
        }

    }

    publishState() {

        const pending = this.repository.list();

        this.app.notionSyncRetryState = {
            pendingCount: pending.length,
            lastError: pending
                .map(item => item.lastError)
                .filter(Boolean)
                .at(-1) ?? null
        };

    }

}
