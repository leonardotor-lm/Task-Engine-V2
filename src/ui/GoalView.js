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

        const directlyAssociated =
            state.allTasks.filter(
                task =>
                    !task.isDeleted() &&
                    (task.goalIds ?? [])
                        .includes(goal.id)
            );

        const availableTasks =
            state.allTasks.filter(
                task =>
                    (
                        task.status === "INBOX" ||
                        task.status === "PENDING"
                    ) &&
                    !(task.goalIds ?? [])
                        .includes(goal.id)
            );

        const taskIdsWithChildren = new Set(
            state.allTasks
                .filter(task =>
                    task.parentTaskId !== null
                )
                .map(task => task.parentTaskId)
        );

        const typeLabel = task => {

            if (taskIdsWithChildren.has(task.id)) {
                return "Proyecto";
            }

            if (task.parentTaskId !== null) {
                return "Subtarea";
            }

            return "Tarea";

        };

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

        const associationItems =
            directlyAssociated.length > 0
                ? directlyAssociated.map(task => `
                    <li class="goalTaskItem">
                        <span>
                            <strong>
                                ${escapeHtml(task.title)}
                            </strong>
                            <small>
                                ${typeLabel(task)}
                                ${task.isCompleted()
                                    ? " · Completada"
                                    : ""}
                            </small>
                        </span>
                        <button
                            type="button"
                            class="detachTaskFromGoal"
                            data-task-id="${escapeHtml(task.id)}">
                            Quitar
                        </button>
                    </li>
                `).join("")
                : `
                    <li class="emptyGoalTasks">
                        No hay tareas ni proyectos asociados.
                    </li>
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

            <section class="goalTasksSection">
                <h3>Asociaciones directas</h3>
                <ul class="goalTaskList">
                    ${associationItems}
                </ul>

                ${availableTasks.length > 0
                    ? `
                        <form id="goalTaskForm">
                            <select
                                id="goalTaskId"
                                required>
                                <option value="">
                                    Asociar tarea o proyecto…
                                </option>
                                ${availableTasks
                                    .map(task => `
                                        <option
                                            value="${escapeHtml(task.id)}">
                                            ${typeLabel(task)}:
                                            ${escapeHtml(task.title)}
                                        </option>
                                    `)
                                    .join("")}
                            </select>
                            <button type="submit">
                                Asociar
                            </button>
                        </form>
                    `
                    : ""}
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
            state.expandedTaskIds,
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
