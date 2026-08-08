export class KeyboardNavigationController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.started = false;

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

        if (!this.document) return;

        this.bindTaskRows();
        this.bindQuickMenus();
        this.bindGoalNavigation();

    }

    bindTaskRows() {

        const rows = this.getTaskRows();

        rows.forEach(row => {

            const task = this.getTask(
                row.dataset?.id
            );
            const title = task?.title ??
                row.querySelector?.(
                    ".taskTitle"
                )?.textContent?.trim() ??
                "Tarea";
            const kind =
                row.classList?.contains(
                    "projectTask"
                )
                    ? "Proyecto"
                    : "Tarea";

            row.setAttribute?.(
                "tabindex",
                "0"
            );
            row.setAttribute?.(
                "aria-label",
                `${kind}: ${title}. Enter o espacio para abrir.`
            );

            row.addEventListener?.(
                "keydown",
                event =>
                    this.handleTaskKeydown(
                        event,
                        row
                    )
            );

        });

    }

    handleTaskKeydown(event, row) {

        if (
            !event ||
            !row ||
            event.target !== row
        ) {
            return;
        }

        const rows = this.getTaskRows();
        const index = rows.indexOf(row);

        if (index < 0) return;

        if (event.key === "ArrowDown") {
            event.preventDefault?.();
            this.focusRow(
                rows[Math.min(
                    index + 1,
                    rows.length - 1
                )]
            );
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault?.();
            this.focusRow(
                rows[Math.max(index - 1, 0)]
            );
            return;
        }

        if (event.key === "Home") {
            event.preventDefault?.();
            this.focusRow(rows[0]);
            return;
        }

        if (event.key === "End") {
            event.preventDefault?.();
            this.focusRow(
                rows[rows.length - 1]
            );
            return;
        }

        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault?.();

            const opensProject =
                row.classList?.contains(
                    "projectTask"
                );

            row.click?.();
            this.focusAfterOpen(
                opensProject
            );
            return;
        }

        if (event.key === "ArrowRight") {
            this.handleArrowRight(
                event,
                row,
                rows,
                index
            );
            return;
        }

        if (event.key === "ArrowLeft") {
            this.handleArrowLeft(
                event,
                row,
                rows
            );
        }

    }

    handleArrowRight(
        event,
        row,
        rows,
        index
    ) {

        const toggle = row.querySelector?.(
            ".toggleSubtasks"
        );

        if (!toggle) return;

        event.preventDefault?.();

        if (
            toggle.getAttribute?.(
                "aria-expanded"
            ) === "false"
        ) {
            const id = row.dataset?.id;
            toggle.click?.();
            this.focusTaskRow(id);
            return;
        }

        const id = row.dataset?.id;

        for (
            let nextIndex = index + 1;
            nextIndex < rows.length;
            nextIndex++
        ) {

            const nextTask = this.getTask(
                rows[nextIndex].dataset?.id
            );

            if (
                nextTask?.parentTaskId === id
            ) {
                this.focusRow(rows[nextIndex]);
                return;
            }

        }

    }

    handleArrowLeft(event, row, rows) {

        const toggle = row.querySelector?.(
            ".toggleSubtasks"
        );

        if (
            toggle?.getAttribute?.(
                "aria-expanded"
            ) === "true"
        ) {
            event.preventDefault?.();
            const id = row.dataset?.id;
            toggle.click?.();
            this.focusTaskRow(id);
            return;
        }

        const task = this.getTask(
            row.dataset?.id
        );

        if (!task?.parentTaskId) return;

        const parentRow = rows.find(
            candidate =>
                candidate.dataset?.id ===
                    task.parentTaskId
        );

        if (!parentRow) return;

        event.preventDefault?.();
        this.focusRow(parentRow);

    }

    bindQuickMenus() {

        this.document.querySelectorAll(
            ".quickMoreActions, .quickPostpone"
        ).forEach(menu => {

            menu.addEventListener?.(
                "keydown",
                event => {

                    if (
                        event.key !== "Escape" ||
                        !menu.open
                    ) {
                        return;
                    }

                    event.preventDefault?.();
                    event.stopPropagation?.();
                    menu.open = false;
                    menu.querySelector?.(
                        ":scope > summary"
                    )?.focus?.();

                }
            );

        });

    }

    bindGoalNavigation() {

        const goals = [
            ...this.document.querySelectorAll(
                ".openGoal"
            )
        ];

        goals.forEach((goal, index) => {

            goal.addEventListener?.(
                "keydown",
                event => {

                    if (event.target !== goal) {
                        return;
                    }

                    let target = null;

                    if (event.key === "ArrowDown") {
                        target = goals[
                            Math.min(
                                index + 1,
                                goals.length - 1
                            )
                        ];
                    } else if (
                        event.key === "ArrowUp"
                    ) {
                        target = goals[
                            Math.max(index - 1, 0)
                        ];
                    } else if (
                        event.key === "Home"
                    ) {
                        target = goals[0];
                    } else if (
                        event.key === "End"
                    ) {
                        target = goals[
                            goals.length - 1
                        ];
                    }

                    if (!target) return;

                    event.preventDefault?.();
                    target.focus?.();

                }
            );

        });

    }

    focusAfterOpen(opensProject) {

        if (opensProject) {
            const heading =
                this.document.querySelector(
                    ".content h2"
                );

            if (heading) {
                heading.setAttribute?.(
                    "tabindex",
                    "-1"
                );
                heading.focus?.();
            }

            return;
        }

        this.document.getElementById(
            "taskTitleEdit"
        )?.focus?.();

    }

    focusTaskRow(id) {

        if (!id) return;

        const row = this.getTaskRows().find(
            candidate =>
                candidate.dataset?.id === id
        );

        this.focusRow(row);

    }

    focusRow(row) {

        row?.focus?.({
            preventScroll: true
        });
        row?.scrollIntoView?.({
            block: "nearest",
            behavior: "auto"
        });

    }

    getTaskRows() {

        if (!this.document) return [];

        return [
            ...this.document.querySelectorAll(
                ".task"
            )
        ];

    }

    getTask(id) {

        if (!id) return null;

        return this.app?.taskService
            ?.getTaskById?.(id) ?? null;

    }

}
