import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";

const WAITING_SEARCH_PATTERN =
    /(?:en\s*espera|enespera|iswaiting|waiting)\s*:/i;

export class WaitingController {

    constructor(app) {
        this.app = app;
        this.showWaitingInArea = false;
        this.renderingWaitingView = false;
    }

    start() {
        this.wrapVisibleTasks();
        this.wrapCallbacks();
        this.wrapUnsavedTaskCheck();
        this.wrapMainViewRender();
        this.wrapAppRender();
    }

    wrapVisibleTasks() {

        const originalGetVisibleTasks =
            this.app.getVisibleTasks.bind(this.app);

        this.app.getVisibleTasks = () => {

            if (
                this.renderingWaitingView ||
                this.app.currentView === View.WAITING
            ) {
                return this.getWaitingTasks();
            }

            const tasks = originalGetVisibleTasks();

            if (this.app.currentView === View.PROJECTS) {
                return tasks;
            }

            if (
                this.app.currentView === View.AREA &&
                this.showWaitingInArea
            ) {
                return tasks;
            }

            if (this.searchIncludesWaitingCriterion()) {
                return tasks;
            }

            return tasks.filter(
                task => !task.isWaiting
            );

        };

    }

    wrapCallbacks() {

        const callbacks =
            this.app.mainView.callbacks;
        const originalUpdateTask =
            callbacks.onUpdateTask;
        const originalShowArea =
            callbacks.onShowArea;

        callbacks.onUpdateTask = (id, data) => {

            const control = document.getElementById(
                "taskIsWaiting"
            );

            const currentTask =
                this.app.taskService.getTaskById(id);

            return originalUpdateTask(id, {
                ...data,
                isWaiting: control
                    ? control.checked
                    : Boolean(currentTask?.isWaiting)
            });

        };

        callbacks.onShowArea = id => {
            this.showWaitingInArea = false;
            return originalShowArea(id);
        };

    }

    wrapUnsavedTaskCheck() {

        const view = this.app.mainView;
        const originalHasUnsavedTaskEdit =
            view.hasUnsavedTaskEdit.bind(view);

        view.hasUnsavedTaskEdit = task => {

            if (originalHasUnsavedTaskEdit(task)) {
                return true;
            }

            const control = document.getElementById(
                "taskIsWaiting"
            );

            return Boolean(
                control &&
                control.checked !==
                    Boolean(task?.isWaiting)
            );

        };

    }

    wrapMainViewRender() {

        const view = this.app.mainView;
        const originalRender =
            view.render.bind(view);

        view.render = state => {

            const preparedState =
                this.prepareState(state);

            originalRender(preparedState);

            this.injectWaitingNavigation(
                preparedState
            );
            this.injectAreaWaitingToggle(
                preparedState
            );
            this.injectTaskEditorControl(
                preparedState.selectedTask
            );
            this.injectSearchReference();
            this.markWaitingRows(
                preparedState
            );
            this.applyWaitingViewHeading(
                preparedState
            );

        };

    }

    wrapAppRender() {

        const originalRender =
            this.app.render.bind(this.app);

        this.app.render = options => {

            if (
                this.app.currentView !==
                    View.WAITING
            ) {
                return originalRender(options);
            }

            this.renderingWaitingView = true;
            this.app.currentView = View.ALL;

            try {
                return originalRender(options);
            } finally {
                this.app.currentView = View.WAITING;
                this.renderingWaitingView = false;
            }

        };

    }

    getWaitingTasks() {

        return this.app.taskService
            .getAllActiveTasks()
            .filter(task => task.isWaiting);

    }

    searchIncludesWaitingCriterion() {

        if (!this.app.advancedSearchMode) {
            return false;
        }

        return WAITING_SEARCH_PATTERN.test(
            String(this.app.searchQuery ?? "")
        );

    }

    prepareState(state) {

        const today = this.app.getTodayString();
        const allActiveTasks =
            this.app.taskService.getAllActiveTasks();
        const availableTasks =
            allActiveTasks.filter(
                task => !task.isWaiting
            );
        const waitingTasks =
            allActiveTasks.filter(
                task => task.isWaiting
            );
        const counts = {
            ...state.taskViewCounts,
            inbox:
                this.app.taskService
                    .getInboxTasks()
                    .filter(task => !task.isWaiting)
                    .length,
            today:
                this.app.taskService
                    .getTodayTasks(today)
                    .filter(task => !task.isWaiting)
                    .length,
            tomorrow:
                this.app.taskService
                    .getTomorrowTasks(today)
                    .filter(task => !task.isWaiting)
                    .length,
            upcoming:
                this.app.taskService
                    .getUpcomingTasks(today)
                    .filter(task => !task.isWaiting)
                    .length,
            all: availableTasks.length,
            waiting: waitingTasks.length
        };

        for (
            const area of
            this.app.areaService.getAllAreas()
        ) {

            const includeWaiting =
                state.view === View.AREA &&
                state.activeAreaId === area.id &&
                this.showWaitingInArea;

            counts[`area:${area.id}`] =
                allActiveTasks.filter(task =>
                    task.areaId === area.id &&
                    (
                        includeWaiting ||
                        !task.isWaiting
                    )
                ).length;

        }

        const allTasks =
            state.view === View.CALENDAR
                ? state.allTasks.filter(
                    task => !task.isWaiting
                )
                : state.allTasks;

        return {
            ...state,
            allTasks,
            taskViewCounts: counts,
            showWaitingInArea:
                this.showWaitingInArea
        };

    }

    injectWaitingNavigation(state) {

        const allButton = document.getElementById(
            "showAll"
        );

        if (!allButton) return;

        const button = document.createElement(
            "button"
        );

        button.id = "showWaiting";
        button.type = "button";
        button.className =
            `sidebarButton${this.renderingWaitingView
                ? " active"
                : ""}`;
        button.innerHTML = `
            <span>En espera</span>
            <span class="sidebarTaskCount">
                (${state.taskViewCounts.waiting ?? 0})
            </span>
        `;

        allButton.before(button);

        if (this.renderingWaitingView) {
            allButton.classList.remove("active");
        }

        button.addEventListener(
            "click",
            async () => {

                const task = this.app.selectedTask;

                if (
                    task &&
                    !await this.app.mainView
                        .confirmDiscardTaskChanges(task)
                ) {
                    return;
                }

                this.showWaitingInArea = false;
                this.app.mainView
                    .navigateFromSidebar(
                        () =>
                            this.app.navigateTo(
                                View.WAITING
                            )
                    );

            }
        );

    }

    injectAreaWaitingToggle(state) {

        if (
            state.view !== View.AREA ||
            !state.activeAreaId
        ) {
            return;
        }

        const controls = document.querySelector(
            ".sidebarListControls"
        );

        if (!controls) return;

        const button = document.createElement(
            "button"
        );

        button.id = "toggleWaitingInArea";
        button.type = "button";
        button.className =
            `taskToolsButton${this.showWaitingInArea
                ? " active"
                : ""}`;
        button.textContent = this.showWaitingInArea
            ? "Ocultar en espera"
            : "Mostrar en espera";

        controls.append(button);

        button.addEventListener(
            "click",
            async () => {

                const task = this.app.selectedTask;

                if (
                    task &&
                    !await this.app.mainView
                        .confirmDiscardTaskChanges(task)
                ) {
                    return;
                }

                this.app.selectedTask = null;
                this.showWaitingInArea =
                    !this.showWaitingInArea;
                this.app.render();

            }
        );

    }

    injectTaskEditorControl(task) {

        if (
            !task ||
            !this.app.taskService.isActiveTask(task) ||
            document.getElementById(
                "taskIsWaiting"
            )
        ) {
            return;
        }

        const dueTime = document.getElementById(
            "taskDueTime"
        );

        if (!dueTime) return;

        const field = document.createElement("div");
        field.className = "waitingTaskEditorField";
        field.innerHTML = `
            <label class="waitingTaskControl"
                for="taskIsWaiting">
                <input
                    id="taskIsWaiting"
                    type="checkbox"
                    ${task.isWaiting
                        ? "checked"
                        : ""}>
                <span>En espera</span>
            </label>
            <p class="waitingTaskHint">
                La tarea queda fuera de las listas habituales hasta que desactives esta opción.
            </p>
        `;

        dueTime.insertAdjacentElement(
            "afterend",
            field
        );

    }

    injectSearchReference() {

        const reference = document.querySelector(
            ".advancedSearchReference"
        );

        if (
            !reference ||
            reference.querySelector(
                "[data-waiting-search-reference]"
            )
        ) {
            return;
        }

        reference.insertAdjacentHTML(
            "beforeend",
            `
                <p data-waiting-search-reference="true">
                    <strong>Espera:</strong>
                    enEspera (sí/no).
                </p>
            `
        );

    }

    markWaitingRows(state) {

        const tasksById = new Map(
            state.allTasks.map(
                task => [task.id, task]
            )
        );

        document.querySelectorAll(
            ".task"
        ).forEach(row => {

            const task = tasksById.get(
                row.dataset.id
            );

            if (!task?.isWaiting) return;

            row.classList.add("waitingTaskRow");

            const taskBody = row.querySelector(
                ".taskBody"
            );

            if (
                taskBody &&
                !row.querySelector(
                    ".waitingTaskIndicator"
                )
            ) {

                let metadata = taskBody.querySelector(
                    ".taskMeta"
                );

                if (!metadata) {
                    metadata = document.createElement("div");
                    metadata.className = "taskMeta";
                    taskBody.append(metadata);
                }

                metadata.insertAdjacentHTML(
                    "afterbegin",
                    `<span
                        class="waitingTaskIndicator"
                        title="En espera"
                        aria-label="En espera">
                        ${Icon.render(
                            "hand",
                            "waitingTaskIcon"
                        )}
                    </span>`
                );
            }

        });

    }

    applyWaitingViewHeading(state) {

        if (!this.renderingWaitingView) return;

        const heading = document.querySelector(
            ".taskListHeading h2"
        );

        if (heading) {
            heading.textContent =
                `En espera (${state.taskViewCounts.waiting ?? 0})`;
        }

        document.querySelector(
            ".content"
        )?.classList.add("waitingTasksView");

    }

}
