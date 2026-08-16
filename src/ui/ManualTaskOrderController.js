import {
    reorderTaskAmongSiblings
} from "../core/ManualTaskOrder.js";

export class ManualTaskOrderController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.draggedId = null;
        this.targetId = null;
        this.placement = "before";
    }

    start() {
        const view = this.app?.mainView;

        if (
            this.started ||
            !view ||
            typeof view.render !== "function"
        ) {
            return;
        }

        this.started = true;

        const originalRender =
            view.render.bind(view);

        view.render = state => {
            originalRender(state);
            this.bind();
        };
    }

    bind() {
        if (!this.canReorder()) return;

        for (const row of this.getRows()) {
            const task = this.getTask(
                row.dataset?.id
            );

            if (!this.isActiveTask(task)) {
                continue;
            }

            const header = row.querySelector?.(
                ".taskHeader"
            );

            if (!header ||
                header.querySelector?.(
                    ".manualOrderHandle"
                )) {
                continue;
            }

            const handle =
                this.document.createElement(
                    "button"
                );

            handle.type = "button";
            handle.className =
                "manualOrderHandle";
            handle.textContent = "⋮⋮";
            handle.setAttribute(
                "aria-label",
                `Reordenar ${task.title}`
            );
            handle.setAttribute(
                "title",
                "Arrastrar para reordenar"
            );

            handle.addEventListener(
                "pointerdown",
                event => this.beginDrag(
                    event,
                    row
                )
            );
            handle.addEventListener(
                "pointermove",
                event => this.moveDrag(event)
            );
            handle.addEventListener(
                "pointerup",
                event => this.endDrag(event)
            );
            handle.addEventListener(
                "pointercancel",
                () => this.cancelDrag()
            );

            header.prepend(handle);
        }
    }

    canReorder() {
        const filters =
            this.app?.taskFilters ?? {};
        const hasFilters = Object.values(
            filters
        ).some(Boolean);

        return Boolean(
            this.document?.createElement &&
            this.app?.taskSort === "MANUAL" &&
            !String(
                this.app?.searchQuery ?? ""
            ).trim() &&
            !this.app?.advancedSearchMode &&
            !hasFilters &&
            !this.app?.bulkSelectionMode
        );
    }

    beginDrag(event, row) {
        if (
            event?.button !== undefined &&
            event.button !== 0
        ) {
            return;
        }

        const id = row?.dataset?.id;
        const task = this.getTask(id);

        if (!id || !this.isActiveTask(task)) {
            return;
        }

        event.preventDefault?.();
        event.currentTarget?.setPointerCapture?.(
            event.pointerId
        );

        this.draggedId = id;
        row.classList?.add(
            "manualOrderDragging"
        );
    }

    moveDrag(event) {
        if (!this.draggedId) return;

        const targetRow = this.document
            ?.elementFromPoint?.(
                event.clientX,
                event.clientY
            )
            ?.closest?.(".task");

        this.clearDropTarget();

        if (!targetRow) return;

        const targetId =
            targetRow.dataset?.id;
        const dragged = this.getTask(
            this.draggedId
        );
        const target = this.getTask(targetId);

        if (
            !targetId ||
            targetId === this.draggedId ||
            !this.isActiveTask(target) ||
            (dragged?.parentTaskId ?? null) !==
                (target?.parentTaskId ?? null)
        ) {
            return;
        }

        const rect =
            targetRow.getBoundingClientRect?.();
        const middle = rect
            ? rect.top + rect.height / 2
            : event.clientY;

        this.targetId = targetId;
        this.placement =
            event.clientY > middle
                ? "after"
                : "before";

        targetRow.classList?.add(
            this.placement === "after"
                ? "manualOrderDropAfter"
                : "manualOrderDropBefore"
        );
    }

    endDrag(event) {
        if (!this.draggedId) return;

        event.preventDefault?.();

        const changed =
            this.targetId
                ? reorderTaskAmongSiblings(
                    this.app.taskService,
                    this.draggedId,
                    this.targetId,
                    this.placement
                )
                : false;

        this.cancelDrag();

        if (changed) {
            this.app.render?.();
        }
    }

    cancelDrag() {
        for (const row of this.getRows()) {
            row.classList?.remove(
                "manualOrderDragging",
                "manualOrderDropBefore",
                "manualOrderDropAfter"
            );
        }

        this.draggedId = null;
        this.targetId = null;
        this.placement = "before";
    }

    clearDropTarget() {
        for (const row of this.getRows()) {
            row.classList?.remove(
                "manualOrderDropBefore",
                "manualOrderDropAfter"
            );
        }

        this.targetId = null;
    }

    getRows() {
        return [
            ...(this.document
                ?.querySelectorAll?.(".task") ?? [])
        ];
    }

    getTask(id) {
        if (!id) return null;

        return this.app?.taskService
            ?.getTaskById?.(id) ?? null;
    }

    isActiveTask(task) {
        return Boolean(
            task &&
            !task.isCompleted?.() &&
            !task.isArchived?.() &&
            !task.isDeleted?.()
        );
    }
}
