import {
    reorderTaskAmongSiblings
} from "../core/ManualTaskOrder.js";

const AUTO_SCROLL_TOP_EDGE = 300;
const AUTO_SCROLL_BOTTOM_EDGE = 72;
const AUTO_SCROLL_MAX_STEP = 14;

export class ManualTaskOrderController {

    constructor(
        app,
        {
            documentRef = globalThis.document,
            windowRef = globalThis.window
        } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.window = windowRef;
        this.started = false;
        this.draggedId = null;
        this.targetId = null;
        this.placement = "before";
        this.activePointerId = null;
        this.scrollContainer = null;
        this.lastPointerX = null;
        this.lastPointerY = null;
        this.autoScrollFrame = null;
        this.pointerMoveHandler =
            event => this.moveDrag(event);
        this.pointerUpHandler =
            event => this.endDrag(event);
        this.pointerCancelHandler =
            event => this.handlePointerCancel(event);
        this.autoScrollHandler =
            () => this.runAutoScroll();
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
                "contextmenu",
                event => {
                    event.preventDefault();
                }
            );
            handle.addEventListener(
                "dragstart",
                event => {
                    event.preventDefault();
                }
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
        event.stopPropagation?.();

        this.cancelDrag();

        this.draggedId = id;
        this.activePointerId =
            event.pointerId ?? null;
        this.lastPointerX =
            event.clientX ?? null;
        this.lastPointerY =
            event.clientY ?? null;
        this.scrollContainer =
            row.closest?.(".content") ??
            this.document?.scrollingElement ??
            null;

        row.classList?.add(
            "manualOrderDragging"
        );

        event.currentTarget?.setPointerCapture?.(
            event.pointerId
        );

        this.bindActivePointer();
    }

    bindActivePointer() {
        this.document?.addEventListener?.(
            "pointermove",
            this.pointerMoveHandler,
            true
        );
        this.document?.addEventListener?.(
            "pointerup",
            this.pointerUpHandler,
            true
        );
        this.document?.addEventListener?.(
            "pointercancel",
            this.pointerCancelHandler,
            true
        );
    }

    unbindActivePointer() {
        this.document?.removeEventListener?.(
            "pointermove",
            this.pointerMoveHandler,
            true
        );
        this.document?.removeEventListener?.(
            "pointerup",
            this.pointerUpHandler,
            true
        );
        this.document?.removeEventListener?.(
            "pointercancel",
            this.pointerCancelHandler,
            true
        );
    }

    isActivePointer(event) {
        return Boolean(
            this.draggedId &&
            (
                this.activePointerId === null ||
                event?.pointerId === undefined ||
                event.pointerId ===
                    this.activePointerId
            )
        );
    }

    moveDrag(event) {
        if (!this.isActivePointer(event)) return;

        event.preventDefault?.();

        this.lastPointerX = event.clientX;
        this.lastPointerY = event.clientY;

        this.updateDropTarget(
            event.clientX,
            event.clientY
        );
        this.ensureAutoScroll();
    }

    updateDropTarget(clientX, clientY) {
        const topTarget =
            this.resolveTopBoundaryTarget(clientY);

        const targetRow = topTarget?.row ??
            this.resolveTargetRow(
                clientX,
                clientY
            );

        if (!targetRow) {
            return false;
        }

        const targetId = targetRow.dataset?.id;
        const rect =
            targetRow.getBoundingClientRect?.();
        const middle = rect
            ? rect.top + rect.height / 2
            : clientY;
        const placement =
            topTarget?.placement ??
            (
                clientY > middle
                    ? "after"
                    : "before"
            );

        this.clearDropClasses();

        this.targetId = targetId;
        this.placement = placement;

        targetRow.classList?.add(
            placement === "after"
                ? "manualOrderDropAfter"
                : "manualOrderDropBefore"
        );

        return true;
    }

    getVisibleTaskIds() {
        return this.getRows()
            .map(row => row.dataset?.id)
            .filter(Boolean);
    }

    getEffectiveVisibleParent(task, visibleIds) {
        const parentId = task?.parentTaskId ?? null;

        if (!parentId) return null;

        return visibleIds.has(parentId)
            ? parentId
            : null;
    }

    isSameVisibleLevel(first, second) {
        const visibleIds = new Set(
            this.getVisibleTaskIds()
        );

        return this.getEffectiveVisibleParent(
            first,
            visibleIds
        ) === this.getEffectiveVisibleParent(
            second,
            visibleIds
        );
    }

    getValidTargetRows() {
        return this.getRows().filter(
            row => this.isValidTargetRow(row)
        );
    }

    getFirstValidTargetRow() {
        return this.getValidTargetRows()[0] ?? null;
    }

    isFirstTargetVisible() {
        const bounds = this.getScrollBounds();
        const firstRow =
            this.getFirstValidTargetRow();
        const rect =
            firstRow?.getBoundingClientRect?.();

        if (!bounds || !firstRow || !rect) {
            return false;
        }

        return (
            rect.bottom >= bounds.top &&
            rect.top <= bounds.bottom
        );
    }

    resolveTopBoundaryTarget(clientY) {
        if (!Number.isFinite(clientY)) {
            return null;
        }

        const bounds = this.getScrollBounds();
        const rows = this.getValidTargetRows();
        const firstRow = rows[0];
        const secondRow = rows[1] ?? null;
        const firstRect =
            firstRow?.getBoundingClientRect?.();
        const secondRect =
            secondRow?.getBoundingClientRect?.();

        if (!bounds || !firstRow || !firstRect) {
            return null;
        }

        const firstVisible =
            firstRect.bottom >= bounds.top &&
            firstRect.top <= bounds.bottom;

        if (!firstVisible) {
            return null;
        }

        const firstMiddle =
            firstRect.top + firstRect.height / 2;
        const secondMiddle = secondRect
            ? secondRect.top + secondRect.height / 2
            : firstRect.bottom;
        const zoneTop = Math.max(
            bounds.top,
            Math.min(firstRect.top, firstMiddle)
        );

        if (
            clientY < zoneTop ||
            clientY > secondMiddle
        ) {
            return null;
        }

        return {
            row: firstRow,
            placement:
                clientY <= firstMiddle
                    ? "before"
                    : "after"
        };
    }

    resolveTargetRow(clientX, clientY) {
        const directRow = this.document
            ?.elementFromPoint?.(
                clientX,
                clientY
            )
            ?.closest?.(".task");

        if (this.isValidTargetRow(directRow)) {
            return directRow;
        }

        return this.findNearestValidRow(clientY);
    }

    findNearestValidRow(clientY) {
        if (!Number.isFinite(clientY)) {
            return null;
        }

        let nearest = null;
        let nearestDistance = Infinity;

        for (const row of this.getValidTargetRows()) {
            const rect =
                row.getBoundingClientRect?.();

            if (!rect) continue;

            const distance =
                clientY < rect.top
                    ? rect.top - clientY
                    : clientY > rect.bottom
                        ? clientY - rect.bottom
                        : 0;

            if (distance < nearestDistance) {
                nearest = row;
                nearestDistance = distance;
            }
        }

        return nearest;
    }

    isValidTargetRow(row) {
        if (!row) return false;

        const targetId = row.dataset?.id;

        if (
            !targetId ||
            targetId === this.draggedId
        ) {
            return false;
        }

        const dragged = this.getTask(
            this.draggedId
        );
        const target = this.getTask(targetId);

        return Boolean(
            this.isActiveTask(target) &&
            this.isSameVisibleLevel(
                dragged,
                target
            )
        );
    }

    ensureAutoScroll() {
        if (
            this.autoScrollFrame !== null ||
            !this.window?.requestAnimationFrame
        ) {
            return;
        }

        this.autoScrollFrame =
            this.window.requestAnimationFrame(
                this.autoScrollHandler
            );
    }

    runAutoScroll() {
        this.autoScrollFrame = null;

        if (
            !this.draggedId ||
            !Number.isFinite(this.lastPointerY)
        ) {
            return;
        }

        const step = this.getAutoScrollStep(
            this.lastPointerY
        );

        if (step === 0) {
            return;
        }

        const moved = this.scrollBy(step);

        if (
            Number.isFinite(this.lastPointerX)
        ) {
            this.updateDropTarget(
                this.lastPointerX,
                this.lastPointerY
            );
        }

        if (moved) {
            this.ensureAutoScroll();
        }
    }

    getAutoScrollStep(pointerY) {
        const bounds = this.getScrollBounds();

        if (!bounds) return 0;

        if (
            pointerY <
            bounds.top + AUTO_SCROLL_TOP_EDGE
        ) {
            if (this.isFirstTargetVisible()) {
                return 0;
            }

            const ratio = Math.min(
                1,
                (
                    bounds.top +
                    AUTO_SCROLL_TOP_EDGE -
                    pointerY
                ) / AUTO_SCROLL_TOP_EDGE
            );

            return -Math.max(
                2,
                Math.round(
                    AUTO_SCROLL_MAX_STEP * ratio
                )
            );
        }

        if (
            pointerY >
            bounds.bottom - AUTO_SCROLL_BOTTOM_EDGE
        ) {
            const ratio = Math.min(
                1,
                (
                    pointerY -
                    (
                        bounds.bottom -
                        AUTO_SCROLL_BOTTOM_EDGE
                    )
                ) / AUTO_SCROLL_BOTTOM_EDGE
            );

            return Math.max(
                2,
                Math.round(
                    AUTO_SCROLL_MAX_STEP * ratio
                )
            );
        }

        return 0;
    }

    getScrollBounds() {
        const rect = this.scrollContainer
            ?.getBoundingClientRect?.();

        if (rect) {
            return {
                top: rect.top,
                bottom: rect.bottom
            };
        }

        const height =
            this.window?.innerHeight;

        if (!Number.isFinite(height)) {
            return null;
        }

        return {
            top: 0,
            bottom: height
        };
    }

    scrollBy(step) {
        if (
            this.scrollContainer &&
            typeof this.scrollContainer.scrollBy ===
                "function"
        ) {
            const before =
                this.scrollContainer.scrollTop;

            this.scrollContainer.scrollBy({
                top: step,
                behavior: "auto"
            });

            const after =
                this.scrollContainer.scrollTop;

            if (
                Number.isFinite(before) &&
                Number.isFinite(after)
            ) {
                return after !== before;
            }

            return true;
        }

        this.window?.scrollBy?.({
            top: step,
            behavior: "auto"
        });

        return true;
    }

    stopAutoScroll() {
        if (
            this.autoScrollFrame !== null &&
            this.window?.cancelAnimationFrame
        ) {
            this.window.cancelAnimationFrame(
                this.autoScrollFrame
            );
        }

        this.autoScrollFrame = null;
    }

    endDrag(event) {
        if (!this.isActivePointer(event)) return;

        event.preventDefault?.();
        event.stopPropagation?.();

        const visibleTaskIds =
            this.getVisibleTaskIds();
        const changed =
            this.targetId
                ? reorderTaskAmongSiblings(
                    this.app.taskService,
                    this.draggedId,
                    this.targetId,
                    this.placement,
                    visibleTaskIds
                )
                : false;

        this.cancelDrag();

        if (changed) {
            this.app.render?.();
        }
    }

    handlePointerCancel(event) {
        if (!this.isActivePointer(event)) return;
        this.cancelDrag();
    }

    cancelDrag() {
        this.unbindActivePointer();
        this.stopAutoScroll();

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
        this.activePointerId = null;
        this.scrollContainer = null;
        this.lastPointerX = null;
        this.lastPointerY = null;
    }

    clearDropClasses() {
        for (const row of this.getRows()) {
            row.classList?.remove(
                "manualOrderDropBefore",
                "manualOrderDropAfter"
            );
        }
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
