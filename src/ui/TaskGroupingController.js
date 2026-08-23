import {
    TaskGrouping,
    TaskGroupingPreferencesRepository
} from "../infrastructure/TaskGroupingPreferencesRepository.js";
import { getTaskSortViewKey } from "./TaskSortPreferencesController.js";

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
        return getTaskSortViewKey(this.app);
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
        this.bindControl();
        this.groupVisibleTasks();
    }

    ensureControl() {
        if (!this.document) return;

        const body = this.document.querySelector?.(
            "#taskToolsDialog .taskViewOptionsBody"
        );

        if (!body) return;

        let control = this.document.getElementById?.(
            "taskGrouping"
        );

        if (!control) {
            const wrapper = this.document.createElement(
                "div"
            );
            wrapper.className = "taskGrouping";
            wrapper.innerHTML = `
                <label for="taskGrouping">
                    Agrupar por
                </label>
                <select id="taskGrouping">
                    <option value="NONE">Sin agrupar</option>
                    <option value="AREA">Área</option>
                    <option value="CONTEXT">Contexto</option>
                    <option value="PROJECT">Proyecto</option>
                </select>
            `;
            body.appendChild(wrapper);
            control = wrapper.querySelector(
                "#taskGrouping"
            );
        }

        if (control) {
            control.value = this.getGrouping();
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
        const fragment = this.document
            .createDocumentFragment();

        for (const group of groups) {
            const header = this.document.createElement(
                "li"
            );
            header.className = "taskGroupHeader";
            header.setAttribute("role", "presentation");
            header.textContent = group.label;
            fragment.appendChild(header);

            for (const task of group.tasks) {
                const row = rowById.get(task.id);
                if (row) fragment.appendChild(row);
            }
        }

        list.appendChild(fragment);
    }
}
