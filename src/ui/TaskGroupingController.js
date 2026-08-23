import { View } from "../core/View.js";
import {
    TaskGrouping,
    TaskGroupingPreferencesRepository
} from "../infrastructure/TaskGroupingPreferencesRepository.js";

function compareGroupLabels(a, b) {
    if (a.unassigned !== b.unassigned) {
        return a.unassigned ? 1 : -1;
    }

    return a.label.localeCompare(
        b.label,
        "es",
        { sensitivity: "base" }
    );
}

function resolveProject(task, tasksById) {
    let current = task;
    let project = task?.isProject ? task : null;
    const visited = new Set();

    while (
        current?.parentTaskId &&
        !visited.has(current.parentTaskId)
    ) {
        visited.add(current.parentTaskId);
        current = tasksById.get(current.parentTaskId) ?? null;

        if (current?.isProject) {
            project = current;
        }
    }

    return project;
}

function buildAncestorPath(task, tasksById) {
    const path = [];
    const visited = new Set();
    let parentId = task?.parentTaskId ?? null;

    while (parentId && !visited.has(parentId)) {
        visited.add(parentId);
        const parent = tasksById.get(parentId);

        if (!parent) break;

        path.unshift(parent);
        parentId = parent.parentTaskId ?? null;
    }

    return path;
}

export function getTaskGroupingViewKey(app) {
    if (app.currentCustomFilterId) {
        return `custom-filter:${app.currentCustomFilterId}`;
    }

    if (app.advancedSearchMode) {
        return "advanced-search";
    }

    switch (app.currentView) {
        case View.AREA:
            return `area:${app.currentAreaId ?? "none"}`;

        case View.PROJECT:
            return `project:${app.projectTaskId ?? "none"}`;

        case View.GOAL:
            return `goal:${app.selectedGoal?.id ?? "none"}`;

        default:
            return `view:${app.currentView ?? View.TODAY}`;
    }
}

export function buildTaskGroups(
    tasks,
    grouping,
    {
        areas = [],
        contexts = [],
        allTasks = tasks
    } = {}
) {
    if (grouping === TaskGrouping.NONE) {
        return [];
    }

    const areasById = new Map(
        areas.map(area => [area.id, area])
    );
    const contextsById = new Map(
        contexts.map(context => [context.id, context])
    );
    const tasksById = new Map(
        allTasks.map(task => [task.id, task])
    );
    const groupsByKey = new Map();

    const ensureGroup = (
        key,
        label,
        unassigned = false
    ) => {
        if (!groupsByKey.has(key)) {
            groupsByKey.set(key, {
                key,
                label,
                unassigned,
                tasks: []
            });
        }

        return groupsByKey.get(key);
    };

    for (const task of tasks) {
        let key = "";
        let label = "";
        let unassigned = false;

        if (grouping === TaskGrouping.AREA) {
            const area = areasById.get(task.areaId);
            key = area?.id ?? "__none__";
            label = area?.name ?? "Sin área";
            unassigned = !area;
        } else if (grouping === TaskGrouping.CONTEXT) {
            const context = contextsById.get(task.contextId);
            key = context?.id ?? "__none__";
            label = context?.name ?? "Sin contexto";
            unassigned = !context;
        } else if (grouping === TaskGrouping.PROJECT) {
            const project = resolveProject(task, tasksById);
            key = project?.id ?? "__none__";
            label = project?.title ?? "Sin proyecto";
            unassigned = !project;
        } else {
            continue;
        }

        ensureGroup(key, label, unassigned)
            .tasks.push(task);
    }

    return Array.from(groupsByKey.values())
        .sort(compareGroupLabels);
}

export class TaskGroupingController {

    constructor(
        app,
        {
            repository = null,
            storage = globalThis.localStorage,
            documentRef = globalThis.document
        } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.repository =
            repository ??
            new TaskGroupingPreferencesRepository(
                storage
            );
        this.started = false;
    }

    start() {
        if (this.started || !this.app) return;
        this.started = true;

        this.app.taskGroupingPreferencesRepository =
            this.repository;

        this.wrapRender();
        this.apply();
    }

    getViewKey() {
        return getTaskGroupingViewKey(this.app);
    }

    getGrouping() {
        return this.repository.get(
            this.getViewKey()
        );
    }

    wrapRender() {
        if (typeof this.app.render !== "function") return;

        const originalRender =
            this.app.render.bind(this.app);

        this.app.render = (...args) => {
            const result = originalRender(...args);
            this.apply();
            return result;
        };
    }

    apply() {
        this.ensureControl();
        this.ensureActiveFiltersNotice();
        this.bindControl();
        this.groupVisibleTasks();
    }

    ensureControl() {
        if (!this.document) return;

        const body = this.document.querySelector?.(
            "#taskContextToolbar .taskContextToolbarBody"
        );

        if (!body) return;

        let control = this.document.getElementById?.(
            "taskGrouping"
        );

        if (!control) {
            const wrapper = this.document.createElement(
                "label"
            );
            wrapper.className =
                "taskContextToolbarSort taskContextToolbarGrouping";
            wrapper.setAttribute(
                "for",
                "taskGrouping"
            );
            wrapper.innerHTML = `
                <span>Agrupar</span>
                <select
                    id="taskGrouping"
                    aria-label="Agrupar tareas">
                    <option value="NONE">Sin agrupar</option>
                    <option value="AREA">Área</option>
                    <option value="CONTEXT">Contexto</option>
                    <option value="PROJECT">Proyecto</option>
                </select>
            `;

            const sortControl = body.querySelector(
                ".taskContextToolbarSort:not(.taskContextToolbarGrouping)"
            );

            if (sortControl) {
                sortControl.insertAdjacentElement(
                    "afterend",
                    wrapper
                );
            } else {
                body.appendChild(wrapper);
            }

            control = wrapper.querySelector(
                "#taskGrouping"
            );
        }

        if (control) {
            control.value = this.getGrouping();
        }
    }

    ensureActiveFiltersNotice() {
        if (!this.document) return;

        this.document.getElementById?.(
            "clearActiveTaskFilters"
        )?.remove();

        const filtersActive = Object.values(
            this.app.taskFilters ?? {}
        ).some(Boolean);

        if (!filtersActive) return;

        const body = this.document.querySelector?.(
            "#taskContextToolbar .taskContextToolbarBody"
        );

        if (!body) return;

        const button = this.document.createElement(
            "button"
        );
        button.id = "clearActiveTaskFilters";
        button.type = "button";
        button.className =
            "taskContextToolbarButton active taskActiveFiltersClear";
        button.textContent = "Filtros activos · Limpiar";
        button.setAttribute(
            "aria-label",
            "Hay filtros activos. Limpiar filtros"
        );
        button.setAttribute(
            "title",
            "Hay filtros activos. Limpiar filtros"
        );
        button.addEventListener("click", () => {
            this.app.mainView?.callbacks
                ?.onClearTaskFilters?.();
        });

        const filtersButton = body.querySelector(
            "#openTaskTools"
        );

        if (filtersButton) {
            filtersButton.insertAdjacentElement(
                "afterend",
                button
            );
        } else {
            body.prepend(button);
        }
    }

    bindControl() {
        const control = this.document
            ?.getElementById?.("taskGrouping");

        if (!control || control.dataset.groupingBound) {
            return;
        }

        control.dataset.groupingBound = "true";
        control.addEventListener("change", event => {
            this.repository.set(
                this.getViewKey(),
                event.target.value
            );
            this.app.render();
        });
    }

    groupVisibleTasks() {
        if (!this.document) return;

        const list = this.document.querySelector?.(
            ".content .taskList"
        );

        if (!list) return;

        for (const header of Array.from(
            list.querySelectorAll(
                ":scope > .taskGroupHeader"
            )
        )) {
            header.remove();
        }

        const grouping = this.getGrouping();

        if (grouping === TaskGrouping.NONE) {
            return;
        }

        const rows = Array.from(list.children)
            .filter(element =>
                element.classList?.contains("task")
            );

        if (rows.length === 0) return;

        const rowById = new Map(
            rows.map(row => [row.dataset.id, row])
        );
        const visibleTasks = rows
            .map(row =>
                this.app.taskService?.getTaskById?.(
                    row.dataset.id
                )
            )
            .filter(Boolean);
        const allTasks =
            this.app.taskService?.getAllTasks?.() ??
            visibleTasks;
        const allTasksById = new Map(
            allTasks.map(task => [task.id, task])
        );
        const groups = buildTaskGroups(
            visibleTasks,
            grouping,
            {
                areas:
                    this.app.areaService?.getAllAreas?.() ?? [],
                contexts:
                    this.app.contextService?.getAllContexts?.() ?? [],
                allTasks
            }
        );
        const groupKeyByTaskId = new Map();

        for (const group of groups) {
            for (const task of group.tasks) {
                groupKeyByTaskId.set(task.id, group.key);
            }
        }

        const fragment = this.document
            .createDocumentFragment();

        for (const group of groups) {
            const header = this.document.createElement(
                "li"
            );
            header.className =
                "taskGroupHeader taskHierarchyPath";
            header.setAttribute("role", "presentation");
            header.textContent = group.label;
            fragment.appendChild(header);

            for (const task of group.tasks) {
                const row = rowById.get(task.id);

                if (!row) continue;

                if (
                    grouping === TaskGrouping.CONTEXT &&
                    task.parentTaskId &&
                    groupKeyByTaskId.has(task.parentTaskId) &&
                    groupKeyByTaskId.get(task.parentTaskId) !==
                        group.key
                ) {
                    this.ensureSeparatedHierarchyPath(
                        row,
                        task,
                        allTasksById
                    );
                }

                fragment.appendChild(row);
            }
        }

        list.appendChild(fragment);
    }

    ensureSeparatedHierarchyPath(
        row,
        task,
        allTasksById
    ) {
        const body = row.querySelector?.(".taskBody");

        if (
            !body ||
            body.querySelector(":scope > .taskHierarchyPath")
        ) {
            return;
        }

        const path = buildAncestorPath(
            task,
            allTasksById
        );

        if (path.length === 0) return;

        const text = path
            .map(item => item.title)
            .join(" › ");
        const breadcrumb = this.document.createElement(
            "div"
        );

        breadcrumb.className =
            "taskHierarchyPath groupingHierarchyPath";
        breadcrumb.textContent = text;
        breadcrumb.setAttribute("title", text);
        breadcrumb.setAttribute(
            "aria-label",
            `Ruta: ${text}`
        );

        body.insertBefore(
            breadcrumb,
            body.querySelector(".taskTitleLine")
        );
    }
}
