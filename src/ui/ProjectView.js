import { TaskList } from "./TaskList.js";
import { Icon } from "./Icon.js";
import { escapeHtml } from "./escapeHtml.js";
import { View } from "../core/View.js";

export class ProjectView {

    constructor() {
        this.taskList = new TaskList();
    }

    render(state) {

        const project = state.projectTask;

        if (!project) {

            return `
                <main class="content">
                    <p class="emptyState">
                        No se encontró el proyecto.
                    </p>
                </main>
            `;

        }

        const projectPresentationTasks =
            this.getProjectPresentationTasks(
                project,
                state.allTasks ?? [
                    project,
                    ...state.tasks
                ]
            );
        const projectProgressTasks =
            this.getProjectProgressTasks(
                project,
                projectPresentationTasks
            );
        const completed =
            projectProgressTasks.filter(
                task => task.isCompleted()
            ).length;

        const total = projectProgressTasks.length;
        const taskById = new Map(
            (state.allTasks ?? [])
                .map(task => [task.id, task])
        );
        const ancestors = this.getAncestors(
            project,
            taskById
        );
        const originLabel =
            this.getOriginLabel(state);
        const headingActions = `
            <button
                id="editProjectTask"
                type="button"
                class="secondaryAction projectHeadingAction responsiveIconButton"
                data-id="${escapeHtml(project.id)}"
                aria-label="Editar proyecto"
                title="Editar proyecto">
                <span class="responsiveButtonIcon">
                    ${Icon.render("edit")}
                </span>
                <span class="responsiveButtonLabel">
                    Editar proyecto
                </span>
            </button>

            ${state.projectTaskCreationOpen
                ? ""
                : `
                    <button
                        id="openProjectTaskCreation"
                        type="button"
                        class="primaryAction projectHeadingAction responsiveIconButton"
                        aria-label="Agregar subtarea"
                        title="Agregar subtarea">
                        <span class="responsiveButtonIcon">
                            ${Icon.render("plus")}
                        </span>
                        <span class="responsiveButtonLabel">
                            Agregar subtarea
                        </span>
                    </button>
                `}

            <button
                id="toggleBulkMode"
                type="button"
                class="secondaryAction projectBulkModeAction responsiveIconButton ${state.bulkSelectionMode
                    ? "active"
                    : ""}"
                aria-label="${state.bulkSelectionMode
                    ? "Salir de selección"
                    : "Selección múltiple"}"
                title="${state.bulkSelectionMode
                    ? "Salir de selección"
                    : "Selección múltiple"}"
                aria-pressed="${state.bulkSelectionMode}">
                <span class="responsiveButtonIcon">
                    ${Icon.render("list-checks")}
                </span>
                <span class="responsiveButtonLabel">
                    ${state.bulkSelectionMode
                        ? "Salir de selección"
                        : "Selección múltiple"}
                </span>
            </button>
        `;

        const breadcrumb = `
            <nav
                class="projectBreadcrumb"
                aria-label="Ruta de proyectos">
                <button
                    id="projectBreadcrumbRoot"
                    type="button"
                    class="projectBreadcrumbLink">
                    ${escapeHtml(originLabel)}
                </button>
                ${ancestors.map(ancestor => `
                    <span
                        class="projectBreadcrumbSeparator"
                        aria-hidden="true">›</span>
                    <button
                        type="button"
                        class="projectBreadcrumbProject projectBreadcrumbLink"
                        data-id="${escapeHtml(ancestor.id)}">
                        ${escapeHtml(ancestor.title)}
                    </button>
                `).join("")}
                <span
                    class="projectBreadcrumbSeparator"
                    aria-hidden="true">›</span>
                <span
                    class="projectBreadcrumbCurrent"
                    aria-current="page">
                    ${escapeHtml(project.title)}
                </span>
            </nav>
        `;

        const projectSummary = `
            ${breadcrumb}
            <div class="projectWorkspaceSummary">
                <span>
                    ${completed} de ${total} completadas
                </span>
            </div>
        `;

        return this.taskList.render(
            state.tasks,
            project.title,
            state.projectTaskCreationOpen,
            state.areas,
            state.contexts,
            state.tags,
            "",
            state.expandedTaskIds,
            false,
            state.selectedTaskIds,
            state.bulkSelectionEnabled,
            state.bulkActionMode,
            state.showTaskMetadata,
            state.today,
            projectPresentationTasks,
            headingActions,
            "Nueva subtarea",
            state.inlineSubtaskParentId,
            projectSummary,
            state.goals,
            "projectWorkspace"
        );

    }

    getProjectPresentationTasks(project, allTasks) {

        if (project.isDeleted()) {
            return allTasks.filter(
                task => task.isDeleted()
            );
        }

        if (project.isArchived()) {
            return allTasks.filter(
                task => task.isArchived()
            );
        }

        return allTasks.filter(
            task =>
                !task.isDeleted() &&
                !task.isArchived()
        );

    }

    getProjectProgressTasks(project, presentationTasks) {

        const childrenByParent = new Map();

        for (const task of presentationTasks) {

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

        const progressTasks = [];
        const visited = new Set([project.id]);
        const pendingParentIds = [project.id];

        while (pendingParentIds.length > 0) {

            const parentId = pendingParentIds.shift();

            for (
                const task of
                childrenByParent.get(parentId) ?? []
            ) {

                if (visited.has(task.id)) continue;

                visited.add(task.id);
                progressTasks.push(task);
                pendingParentIds.push(task.id);

            }

        }

        return progressTasks;

    }

    getAncestors(project, taskById) {

        const ancestors = [];
        const visited = new Set([project.id]);
        let parentId = project.parentTaskId;

        while (parentId && !visited.has(parentId)) {

            const parent = taskById.get(parentId);

            if (!parent) break;

            ancestors.unshift(parent);
            visited.add(parent.id);
            parentId = parent.parentTaskId;

        }

        return ancestors;

    }

    getOriginLabel(state) {

        if (state.projectOriginCustomFilter?.name) {
            return state.projectOriginCustomFilter.name;
        }

        if (
            state.projectOriginView === View.AREA &&
            state.activeArea?.name
        ) {
            return state.activeArea.name;
        }

        if (
            state.projectOriginView === View.GOAL &&
            state.selectedGoal?.title
        ) {
            return state.selectedGoal.title;
        }

        const labels = {
            [View.INBOX]: "Inbox",
            [View.TODAY]: "Hoy",
            [View.TOMORROW]: "Mañana",
            [View.UPCOMING]: "Próximas",
            [View.ALL]: "Todas",
            [View.PROJECTS]: "Proyectos",
            [View.WAITING]: "En espera",
            [View.CALENDAR]: "Calendario",
            [View.COMPLETED]: "Completadas",
            [View.ARCHIVED]: "Archivadas",
            [View.TRASH]: "Papelera",
            [View.GOALS]: "Objetivos",
            [View.GOAL]: "Objetivo",
            [View.STATISTICS]: "Estadísticas",
            [View.AREAS]: "Áreas",
            [View.CONTEXTS]: "Contextos",
            [View.TAGS]: "Etiquetas"
        };

        return labels[state.projectOriginView] ?? "Tareas";

    }

}
