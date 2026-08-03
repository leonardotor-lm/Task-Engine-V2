import { TaskList } from "./TaskList.js";
import { Icon } from "./Icon.js";

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

        const completed =
            state.tasks.filter(
                task => task.isCompleted()
            ).length;

        const total = state.tasks.length;
        const backLabel =
            state.projectNavigationDepth > 0
                ? "Volver al proyecto anterior"
                : "Volver";

        const headingActions = `
            <button
                id="closeProjectView"
                type="button"
                class="tertiaryAction projectHeadingAction responsiveIconButton"
                aria-label="${backLabel}"
                title="${backLabel}">
                <span class="responsiveButtonIcon">
                    ${Icon.render("back")}
                </span>
                <span class="responsiveButtonLabel">
                    ${backLabel}
                </span>
            </button>

            <button
                id="editProjectTask"
                type="button"
                class="secondaryAction projectHeadingAction responsiveIconButton"
                data-id="${project.id}"
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
        `;

        const projectSummary = `
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
            new Set(),
            false,
            null,
            state.showTaskMetadata,
            state.today,
            state.allTasks,
            headingActions,
            "Nueva subtarea",
            state.inlineSubtaskParentId,
            projectSummary,
            [],
            "projectWorkspace"
        );

    }

}
