import { View } from "../core/View.js";
import {
    filterTaskTreeByCriteria
} from "../core/TaskFilters.js";

const FULL_SUMMARY_VIEWS = new Set([
    View.INBOX,
    View.TODAY,
    View.ALL,
    View.PROJECTS,
    View.AREA,
    View.PROJECT
]);

const PENDING_ONLY_VIEWS = new Set([
    View.TOMORROW,
    View.UPCOMING
]);

const TOTAL_ONLY_VIEWS = new Map([
    [View.COMPLETED, "completadas"],
    [View.ARCHIVED, "archivadas"],
    [View.TRASH, "en papelera"]
]);

function isActiveTask(task) {
    return Boolean(
        task &&
        !task.isCompleted() &&
        !task.isArchived() &&
        !task.isDeleted()
    );
}

function datePart(value) {
    return value
        ? String(value).slice(0, 10)
        : "";
}

function getProjectDescendants(
    projectId,
    tasks
) {
    if (!projectId) return [];

    const childrenByParent = new Map();

    for (const task of tasks) {
        if (!task.parentTaskId) continue;

        const children =
            childrenByParent.get(
                task.parentTaskId
            ) ?? [];

        children.push(task);
        childrenByParent.set(
            task.parentTaskId,
            children
        );
    }

    const descendants = [];
    const pendingIds = [projectId];
    const visited = new Set([projectId]);

    while (pendingIds.length > 0) {
        const parentId = pendingIds.shift();

        for (
            const task of
            childrenByParent.get(parentId) ?? []
        ) {
            if (visited.has(task.id)) continue;

            visited.add(task.id);
            descendants.push(task);
            pendingIds.push(task.id);
        }
    }

    return descendants;
}

function getCompletedScope(state) {
    const completedTasks =
        (state.allTasks ?? [])
            .filter(task => task.isCompleted());

    switch (state.view) {
        case View.TODAY:
            return completedTasks.filter(
                task =>
                    datePart(task.completedAt) ===
                    state.today
            );

        case View.AREA:
            return completedTasks.filter(
                task =>
                    task.areaId ===
                    state.activeAreaId
            );

        case View.PROJECTS:
            return completedTasks.filter(
                task => task.isProject === true
            );

        case View.PROJECT:
            return getProjectDescendants(
                state.projectTask?.id,
                state.allTasks ?? []
            ).filter(task => task.isCompleted());

        case View.INBOX:
            return completedTasks.filter(
                task =>
                    task.areaId === null &&
                    task.dueDate === null
            );

        case View.ALL:
            return completedTasks;

        default:
            return [];
    }
}

function applyCurrentCriteria(
    tasks,
    state
) {
    if (state.view === View.PROJECT) {
        return [...tasks];
    }

    const filters =
        state.view === View.AREA
            ? {
                ...(state.taskFilters ?? {}),
                areaId: state.activeAreaId
            }
            : (state.taskFilters ?? {});

    return filterTaskTreeByCriteria(
        tasks,
        {
            query: state.searchQuery ?? "",
            filters,
            today: state.today ?? ""
        }
    );
}

export function buildViewTaskSummary(state) {
    const tasks = state?.tasks ?? [];

    if (
        state?.advancedSearchMode &&
        state?.searchQuery
    ) {
        return {
            advancedResultCount: tasks.length,
            items: []
        };
    }

    if (TOTAL_ONLY_VIEWS.has(state?.view)) {
        return {
            advancedResultCount: null,
            items: [{
                kind: "total",
                value: tasks.length,
                label: TOTAL_ONLY_VIEWS.get(
                    state.view
                )
            }]
        };
    }

    const activeTasks = tasks.filter(
        isActiveTask
    );

    if (PENDING_ONLY_VIEWS.has(state?.view)) {
        return {
            advancedResultCount: null,
            items: [{
                kind: "total",
                value: activeTasks.length,
                label: "tareas"
            }]
        };
    }

    if (!FULL_SUMMARY_VIEWS.has(state?.view)) {
        return {
            advancedResultCount: null,
            items: []
        };
    }

    const today = state.today ?? "";
    const completedTasks = applyCurrentCriteria(
        getCompletedScope(state),
        state
    );

    return {
        advancedResultCount: null,
        items: [
            {
                kind: "total",
                value: activeTasks.length,
                label: "tareas"
            },
            {
                kind: "today",
                value: activeTasks.filter(
                    task => task.dueDate === today
                ).length,
                label: "vencen hoy"
            },
            {
                kind: "overdue",
                value: activeTasks.filter(
                    task =>
                        Boolean(
                            task.dueDate &&
                            task.dueDate < today
                        )
                ).length,
                label: "vencidas"
            },
            {
                kind: "completed",
                value: completedTasks.length,
                label: "completadas"
            }
        ]
    };
}

export class ViewTaskSummaryController {
    constructor(app) {
        this.app = app;
        this.started = false;
    }

    start() {
        if (
            this.started ||
            !this.app?.mainView?.render
        ) {
            return;
        }

        this.started = true;

        const originalRender =
            this.app.mainView.render.bind(
                this.app.mainView
            );

        this.app.mainView.render = state => {
            originalRender(state);
            this.decorate(state);
        };
    }

    decorate(state) {
        const heading = document.querySelector(
            ".taskListHeading"
        );
        const title = heading?.querySelector("h2");

        if (!heading || !title) return;

        title.textContent = title.textContent
            .replace(/\s+\(\d+\)$/, "");

        const waitingView = Boolean(
            document.querySelector(
                ".content.waitingTasksView"
            )
        );

        const summary = waitingView
            ? {
                advancedResultCount: null,
                items: [{
                    kind: "total",
                    value: (state.tasks ?? [])
                        .filter(isActiveTask)
                        .length,
                    label: "tareas"
                }]
            }
            : buildViewTaskSummary(state);

        if (
            summary.advancedResultCount !== null
        ) {
            this.decorateAdvancedSearch(
                summary.advancedResultCount
            );
            return;
        }

        if (summary.items.length === 0) return;

        const titleBlock =
            document.createElement("div");
        titleBlock.className =
            "taskListTitleSummary";

        heading.insertBefore(titleBlock, title);
        titleBlock.appendChild(title);

        const summaryElement =
            document.createElement("div");
        summaryElement.className =
            "taskViewSummary";
        summaryElement.setAttribute(
            "aria-label",
            "Resumen de la vista"
        );

        for (const item of summary.items) {
            const element =
                document.createElement("span");
            element.className =
                `taskViewSummaryItem taskViewSummaryItem-${item.kind}`;
            element.textContent =
                `${item.value} ${item.label}`;
            summaryElement.appendChild(element);
        }

        titleBlock.appendChild(summaryElement);
    }

    decorateAdvancedSearch(resultCount) {
        const notice = document.querySelector(
            ".advancedSearchActiveNotice"
        );
        const label = notice?.querySelector("strong");

        if (!label) return;

        label.textContent =
            `Búsqueda avanzada · ${resultCount} ${resultCount === 1
                ? "resultado"
                : "resultados"}`;
    }
}
