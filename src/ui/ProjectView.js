import { TaskList } from "./TaskList.js";
import { escapeHtml } from "./escapeHtml.js";

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

        const headingActions = `
            <button
                id="closeProjectView"
                type="button"
                class="secondaryAction">
                Volver
            </button>

            <button
                id="editProjectTask"
                type="button"
                class="secondaryAction"
                data-id="${project.id}">
                Editar proyecto
            </button>
        `;

        return this.taskList.render(
            state.tasks,
            `${escapeHtml(project.title)} · ${completed}/${total}`,
            false,
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
            headingActions
        );

    }

}
