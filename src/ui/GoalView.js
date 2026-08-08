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

        const goals = state.goals ?? [];
        const goalById = new Map(
            goals.map(item => [item.id, item])
        );
        const parentGoal = goal.parentGoalId
            ? goalById.get(goal.parentGoalId) ?? null
            : null;
        const ancestors = this.getAncestors(
            goal,
            goalById
        );
        const completedTasks = state.tasks.filter(
            task => task.isCompleted()
        ).length;
        const directSubgoals = goals
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
            ${parentGoal
                ? `
                    <button
                        id="backToParentGoal"
                        type="button"
                        class="secondaryAction goalHeadingAction responsiveIconButton"
                        data-id="${escapeHtml(parentGoal.id)}"
                        aria-label="Volver al objetivo ${escapeHtml(parentGoal.title)}"
                        title="Volver al objetivo ${escapeHtml(parentGoal.title)}">
                        <span class="responsiveButtonIcon">
                            ${Icon.render("back")}
                        </span>
                        <span class="responsiveButtonLabel">
                            Atrás
                        </span>
                    </button>
                `
                : ""}

            <button
                id="closeGoalView"
                type="button"
                class="secondaryAction goalHeadingAction responsiveIconButton"
                aria-label="Volver a la lista de objetivos"
                title="Volver a la lista de objetivos">
                <span class="responsiveButtonIcon">
                    ${Icon.render("menu")}
                </span>
                <span class="responsiveButtonLabel">
                    Objetivos
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

        const breadcrumb = `
            <nav
                class="goalBreadcrumb"
                aria-label="Ruta de objetivos">
                <button
                    id="goalBreadcrumbRoot"
                    type="button"
                    class="openGoal goalBreadcrumbLink">
                    Objetivos
                </button>
                ${ancestors.map(ancestor => `
                    <span
                        class="goalBreadcrumbSeparator"
                        aria-hidden="true">›</span>
                    <button
                        type="button"
                        class="openGoal goalBreadcrumbGoal goalBreadcrumbLink"
                        data-id="${escapeHtml(ancestor.id)}">
                        ${escapeHtml(ancestor.title)}
                    </button>
                `).join("")}
                <span
                    class="goalBreadcrumbSeparator"
                    aria-hidden="true">›</span>
                <span
                    class="goalBreadcrumbCurrent"
                    aria-current="page">
                    ${escapeHtml(goal.title)}
                </span>
            </nav>
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
            ${breadcrumb}

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

    getAncestors(goal, goalById) {

        const ancestors = [];
        const visited = new Set([goal.id]);
        let parentId = goal.parentGoalId;

        while (parentId && !visited.has(parentId)) {

            const parent = goalById.get(parentId);

            if (!parent) break;

            ancestors.unshift(parent);
            visited.add(parent.id);
            parentId = parent.parentGoalId;

        }

        return ancestors;

    }

}
