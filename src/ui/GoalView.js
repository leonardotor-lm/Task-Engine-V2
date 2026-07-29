import { TaskList } from "./TaskList.js";
import { escapeHtml } from "./escapeHtml.js";

export class GoalView {

    constructor() {
        this.taskList = new TaskList();
    }

    render(state) {

        const goal = state.selectedGoal;

        if (!goal) {
            return `
                <main class="content">
                    <p class="emptyState">
                        No se encontró el objetivo.
                    </p>
                </main>
            `;
        }

        const completed = state.tasks.filter(
            task => task.isCompleted()
        ).length;

        const headingActions = `
            <button
                id="closeGoalView"
                type="button"
                class="secondaryAction">
                Volver
            </button>

            <button
                id="editGoal"
                type="button"
                class="secondaryAction">
                Editar objetivo
            </button>
        `;

        const intro = `
            <section class="goalWorkspaceSummary">
                ${goal.description
                    ? `
                        <p>
                            ${escapeHtml(goal.description)}
                        </p>
                    `
                    : ""}
                <p>
                    <strong>Progreso:</strong>
                    ${completed}/${state.tasks.length}
                    ${goal.dueDate
                        ? `
                            · <strong>Fecha límite:</strong>
                            ${escapeHtml(goal.dueDate)}
                        `
                        : ""}
                </p>
            </section>

            <h3 class="goalWorkHeading">
                Tareas y proyectos
            </h3>
        `;

        return this.taskList.render(
            state.tasks,
            goal.title,
            false,
            state.areas,
            state.contexts,
            state.tags,
            "",
            state.goalExpandedTaskIds,
            false,
            new Set(),
            false,
            null,
            state.showTaskMetadata,
            state.today,
            state.allTasks,
            headingActions,
            "Nueva tarea",
            state.inlineSubtaskParentId,
            intro
        );

    }

}
