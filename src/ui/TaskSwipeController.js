export const SwipeAction = Object.freeze({
    COMPLETE: "COMPLETE",
    OPEN_ACTIONS: "OPEN_ACTIONS"
});

export class TaskSwipeController {

    constructor({
        threshold = 72,
        maximumDistance = 96
    } = {}) {

        this.threshold = threshold;
        this.maximumDistance =
            maximumDistance;

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

                if (completed !== false) {

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

            <button type="button">
                Deshacer
            </button>
        `;

        const remove = () => {
            notice.remove();
        };

        const timeout =
            window.setTimeout(
                remove,
                5000
            );

        notice.querySelector(
            "button"
        ).addEventListener(
            "click",
            () => {

                window.clearTimeout(
                    timeout
                );

                onUndoComplete?.(
                    taskId
                );

                remove();

            }
        );

        document.body.appendChild(
            notice
        );

    }

}
