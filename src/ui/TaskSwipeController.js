export const SwipeAction = Object.freeze({
    COMPLETE: "COMPLETE",
    OPEN_ACTIONS: "OPEN_ACTIONS"
});

export class TaskSwipeController {

    constructor({
        threshold = 72,
        maximumDistance = 96,
        noticeDuration = 8000,
        setTimeoutFn = (...args) =>
            globalThis.setTimeout(...args),
        clearTimeoutFn = timeoutId =>
            globalThis.clearTimeout(timeoutId),
        now = () => Date.now()
    } = {}) {

        this.threshold = threshold;
        this.maximumDistance =
            maximumDistance;
        this.noticeDuration = noticeDuration;
        this.setTimeoutFn = setTimeoutFn;
        this.clearTimeoutFn = clearTimeoutFn;
        this.now = now;
        this.dismissCompletionNotice = null;

    }

    getAction(deltaX, deltaY) {

        const horizontal =
            Math.abs(deltaX);

        const vertical =
            Math.abs(deltaY);

        if (
            horizontal < this.threshold ||
            horizontal <= vertical * 1.2
        ) {
            return null;
        }

        return deltaX > 0
            ? SwipeAction.COMPLETE
            : SwipeAction.OPEN_ACTIONS;

    }

    bind({
        onComplete,
        onUndoComplete
    } = {}) {

        document.querySelectorAll(
            ".task"
        ).forEach(task => {

            if (
                task.querySelector(
                    ".bulkTaskCheckbox"
                )
            ) {
                return;
            }

            const completeControl =
                task.querySelector(
                    ".taskCompleteCheckbox"
                );

            const actionsMenu =
                task.querySelector(
                    ".quickMoreActions"
                );

            if (
                !completeControl &&
                !actionsMenu
            ) {
                return;
            }

            this.bindTask(
                task,
                completeControl,
                actionsMenu,
                onComplete,
                onUndoComplete
            );

        });

    }

    bindTask(
        task,
        completeControl,
        actionsMenu,
        onComplete,
        onUndoComplete
    ) {

        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let deltaX = 0;
        let deltaY = 0;
        let suppressClick = false;

        const reset = () => {

            task.style.transition =
                "transform 160ms ease-out";

            task.style.transform =
                "translateX(0)";

            window.setTimeout(() => {

                task.style.removeProperty(
                    "transition"
                );

                task.style.removeProperty(
                    "transform"
                );

                task.classList.remove(
                    "swipingRight",
                    "swipingLeft"
                );

            }, 170);

        };

        task.addEventListener(
            "click",
            event => {

                if (!suppressClick) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                suppressClick = false;

            },
            true
        );

        task.addEventListener(
            "pointerdown",
            event => {

                if (
                    event.pointerType !== "touch" ||
                    event.target.closest(
                        "button, input, select, summary, details, form, label"
                    )
                ) {
                    return;
                }

                pointerId = event.pointerId;
                startX = event.clientX;
                startY = event.clientY;
                deltaX = 0;
                deltaY = 0;

                task.setPointerCapture(
                    pointerId
                );

            }
        );

        task.addEventListener(
            "pointermove",
            event => {

                if (
                    event.pointerId !== pointerId
                ) {
                    return;
                }

                deltaX =
                    event.clientX - startX;

                deltaY =
                    event.clientY - startY;

                if (
                    Math.abs(deltaY) >
                    Math.abs(deltaX)
                ) {
                    return;
                }

                if (
                    deltaX > 0 &&
                    !completeControl
                ) {
                    deltaX = 0;
                }

                if (
                    deltaX < 0 &&
                    !actionsMenu
                ) {
                    deltaX = 0;
                }

                const distance = Math.max(
                    -this.maximumDistance,
                    Math.min(
                        this.maximumDistance,
                        deltaX
                    )
                );

                task.classList.toggle(
                    "swipingRight",
                    distance > 0
                );

                task.classList.toggle(
                    "swipingLeft",
                    distance < 0
                );

                task.style.transform =
                    `translateX(${distance}px)`;

            }
        );

        const finish = event => {

            if (
                event.pointerId !== pointerId
            ) {
                return;
            }

            const action =
                this.getAction(
                    deltaX,
                    deltaY
                );

            pointerId = null;

            if (
                action ===
                    SwipeAction.COMPLETE &&
                completeControl
            ) {

                suppressClick = true;

                const taskId =
                    completeControl.dataset.id;

                const completed =
                    onComplete?.(taskId);

                if (
                    completed &&
                    typeof completed.then ===
                        "function"
                ) {

                    completed.then(succeeded => {

                        if (succeeded !== false) {
                            this.showCompletionNotice(
                                taskId,
                                onUndoComplete
                            );
                        }

                    });

                } else if (completed !== false) {

                    this.showCompletionNotice(
                        taskId,
                        onUndoComplete
                    );

                }

            }

            if (
                action ===
                    SwipeAction.OPEN_ACTIONS &&
                actionsMenu
            ) {

                suppressClick = true;
                actionsMenu.open = true;

            }

            reset();

        };

        task.addEventListener(
            "pointerup",
            finish
        );

        task.addEventListener(
            "pointercancel",
            event => {

                if (
                    event.pointerId !== pointerId
                ) {
                    return;
                }

                pointerId = null;
                reset();

            }
        );

    }

    showCompletionNotice(
        taskId,
        onUndoComplete
    ) {

        this.dismissCompletionNotice?.();
        document.getElementById(
            "taskCompletionNotice"
        )?.remove();

        const notice =
            document.createElement("div");

        notice.id =
            "taskCompletionNotice";

        notice.className =
            "taskCompletionNotice";

        notice.setAttribute(
            "role",
            "status"
        );

        notice.innerHTML = `
            <span>Tarea completada</span>

            <div class="taskCompletionNoticeActions">
                <button
                    type="button"
                    class="undoTaskCompletion">
                    Deshacer
                </button>

                <button
                    type="button"
                    class="closeTaskCompletionNotice"
                    aria-label="Cerrar aviso">
                    Cerrar
                </button>
            </div>
        `;

        let remaining = this.noticeDuration;
        let startedAt = 0;
        let timeoutId = null;
        let focusInside = false;

        const clearSchedule = () => {
            if (timeoutId === null) return;
            this.clearTimeoutFn(timeoutId);
            timeoutId = null;
        };

        const remove = () => {
            clearSchedule();
            notice.remove();
            if (
                this.dismissCompletionNotice ===
                remove
            ) {
                this.dismissCompletionNotice = null;
            }
        };

        const schedule = () => {
            if (timeoutId !== null) return;
            if (remaining <= 0) {
                remove();
                return;
            }
            startedAt = this.now();
            timeoutId = this.setTimeoutFn(
                remove,
                remaining
            );
        };

        const pause = () => {
            if (timeoutId === null) return;
            remaining = Math.max(
                0,
                remaining -
                    (this.now() - startedAt)
            );
            clearSchedule();
        };

        const resume = () => {
            if (focusInside) return;
            schedule();
        };

        this.dismissCompletionNotice = remove;

        notice.querySelector(
            ".undoTaskCompletion"
        ).addEventListener(
            "click",
            async () => {

                const succeeded =
                    await onUndoComplete?.(
                    taskId
                );

                if (succeeded !== false) {
                    remove();
                }

            }
        );

        notice.querySelector(
            ".closeTaskCompletionNotice"
        ).addEventListener(
            "click",
            remove
        );

        notice.addEventListener(
            "focusin",
            () => {
                focusInside = true;
                pause();
            }
        );
        notice.addEventListener(
            "focusout",
            event => {
                if (
                    notice.contains?.(
                        event.relatedTarget
                    )
                ) {
                    return;
                }
                focusInside = false;
                resume();
            }
        );

        document.body.appendChild(
            notice
        );

        schedule();

    }

}
