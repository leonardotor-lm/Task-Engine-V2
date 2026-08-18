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
            documentRef = globalThis.document,
            taskNotesController = null,
            goalNotesController = null
        } = {}
    ) {
        this.app = app;
        this.repository = repository ??
            new NotionSyncRetryRepository(storage);
        this.window = windowRef;
        this.document = documentRef;
        this.taskNotesController = taskNotesController;
        this.goalNotesController = goalNotesController;
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

    getCurrentScope() {

        if (!this.app?.syncConfig?.isConfigured?.()) {
            return "";
        }

        return String(
            this.app.syncConfig.get?.().url || ""
        ).trim();

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
            const scope = String(
                args?.url || this.getCurrentScope()
            ).trim();

            try {
                const result = await bound(args);
                if (operation) {
                    this.repository.remove(
                        operation.key,
                        scope
                    );
                    this.clearEntityError(operation);
                    this.publishState();
                }
                return result;
            } catch (error) {
                if (operation) {
                    this.repository.upsert({
                        ...operation,
                        attempts: (
                            this.repository.list(scope).find(
                                item => item.key === operation.key
                            )?.attempts ?? 0
                        ) + 1,
                        lastError: error?.message ||
                            "Error desconocido."
                    }, scope);
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

        const connection = this.app.syncConfig.get();
        const scope = String(connection?.url || "").trim();
        const pending = this.repository.list(scope);

        if (pending.length === 0) {
            this.publishState();
            return;
        }

        this.retrying = true;

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
                    this.repository.remove(
                        operation.key,
                        scope
                    );
                    this.clearEntityError(operation);
                } catch (error) {
                    this.repository.upsert({
                        ...operation,
                        attempts: Number(
                            operation.attempts ?? 0
                        ) + 1,
                        lastError: error?.message ||
                            "Error desconocido."
                    }, scope);
                }

            }

        } finally {
            this.retrying = false;
            this.publishState();
        }

    }

    clearEntityError(operation) {

        const controller = operation.kind === "goal"
            ? this.goalNotesController
            : this.taskNotesController;
        const errorId = operation.kind === "goal"
            ? controller?.errorGoalId
            : controller?.errorTaskId;

        if (
            !controller ||
            errorId !== operation.entityId ||
            typeof controller.clearError !== "function"
        ) {
            return;
        }

        controller.clearError();

        const selectedId = operation.kind === "goal"
            ? this.app?.selectedGoal?.id
            : this.app?.selectedTask?.id;

        if (
            selectedId === operation.entityId &&
            typeof this.app?.render === "function"
        ) {
            this.app.render();
        }

    }

    publishState() {

        const pending = this.repository.list(
            this.getCurrentScope()
        );
        const state = {
            pendingCount: pending.length,
            lastError: pending
                .map(item => item.lastError)
                .filter(Boolean)
                .at(-1) ?? null
        };

        this.app.notionSyncRetryState = state;

        if (!this.document?.dispatchEvent) {
            return;
        }

        const CustomEventCtor =
            this.window?.CustomEvent ??
            globalThis.CustomEvent;

        if (typeof CustomEventCtor !== "function") {
            return;
        }

        this.document.dispatchEvent(
            new CustomEventCtor(
                "notion-sync-retry-state-changed",
                { detail: state }
            )
        );

    }

}
