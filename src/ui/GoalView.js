import { TaskList } from "./TaskList.js";
import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";
import { GoalStatus } from "../domain/GoalStatus.js";

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

        const completedTasks = state.tasks.filter(
            task => task.isCompleted()
        ).length;
        const directSubgoals = (state.goals ?? [])
            .filter(subgoal =>
                subgoal.parentGoalId === goal.id &&
                (
                    subgoal.status === GoalStatus.ACTIVE ||
                    subgoal.status === GoalStatus.COMPLETED
                )
            );
        const completedSubgoals = directSubgoals
            .filter(subgoal =>
                subgoal.status === GoalStatus.COMPLETED
            )
            .length;
        const progressParts = [];

        if (state.tasks.length > 0) {
            progressParts.push(
                `Tareas ${completedTasks}/${state.tasks.length}`
            );
        }

        if (directSubgoals.length > 0) {
            progressParts.push(
                `Subobjetivos ${completedSubgoals}/${directSubgoals.length}`
            );
        }

        const progress = progressParts.length > 0
            ? progressParts.join(" · ")
            : "Sin elementos";

        const headingActions = `
            <button
                id="closeGoalView"
                type="button"
                class="secondaryAction goalHeadingAction responsiveIconButton"
                aria-label="Volver a objetivos"
                title="Volver a objetivos">
                <span class="responsiveButtonIcon">
                    ${Icon.render("back")}
                </span>
                <span class="responsiveButtonLabel">
                    Volver
                </span>
            </button>

            <button
                id="editGoal"
                type="button"
                class="secondaryAction goalHeadingAction responsiveIconButton"
                aria-label="Editar objetivo"
                title="Editar objetivo">
                <span class="responsiveButtonIcon">
                    ${Icon.render("edit")}
                </span>
                <span class="responsiveButtonLabel">
                    Editar objetivo
                </span>
            </button>
        `;

        const subgoals = directSubgoals.length > 0
            ? `
                <section class="goalWorkspaceSubgoals">
                    <h3 class="goalWorkHeading">
                        Subobjetivos
                    </h3>
                    <ul class="goalList goalWorkspaceSubgoalList">
                        ${directSubgoals.map(subgoal => `
                            <li class="goalItem">
                                <button
                                    type="button"
                                    class="openGoal goalWorkspaceSubgoal"
                                    data-id="${escapeHtml(subgoal.id)}"
                                    aria-label="Abrir subobjetivo ${escapeHtml(subgoal.title)}">
                                    ${subgoal.status === GoalStatus.COMPLETED
                                        ? Icon.render(
                                            "check",
                                            "inlineStatusIcon"
                                        )
                                        : ""}
                                    ${escapeHtml(subgoal.title)}
                                </button>
                            </li>
                        `).join("")}
                    </ul>
                </section>
            `
            : "";

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
                    ${progress}
                    ${goal.dueDate
                        ? `
                            · <strong>Fecha límite:</strong>
                            ${escapeHtml(goal.dueDate)}
                        `
                        : ""}
                </p>
            </section>

            ${subgoals}

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
