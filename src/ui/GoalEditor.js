import { escapeHtml } from "./escapeHtml.js";

export class GoalEditor {

    render(
        goal,
        goals = [],
        tasks = []
    ) {

        if (!goal) return "";

        const descendants =
            this.getDescendantIds(
                goal.id,
                goals
            );

        const possibleParents = goals.filter(
            item =>
                item.id !== goal.id &&
                !descendants.has(item.id) &&
                item.status === "ACTIVE"
        );

        const associatedTasks = tasks.filter(
            task =>
                task.status !== "DELETED" &&
                (task.goalIds ?? [])
                    .includes(goal.id)
        );

        const availableTasks = tasks.filter(
            task =>
                (
                    task.status === "INBOX" ||
                    task.status === "PENDING"
                ) &&
                !(task.goalIds ?? [])
                    .includes(goal.id)
        );

        const taskIdsWithChildren = new Set(
            tasks
                .filter(task =>
                    task.parentTaskId !== null
                )
                .map(task => task.parentTaskId)
        );

        const taskTypeLabel = task => {

            if (
                taskIdsWithChildren.has(task.id)
            ) {
                return "Proyecto";
            }

            if (task.parentTaskId !== null) {
                return "Subtarea";
            }

            return "Tarea";

        };

        const associatedTaskItems =
            associatedTasks.length > 0
                ? associatedTasks.map(task => `

                    <li class="goalTaskItem">

                        <span>
                            <strong>
                                ${escapeHtml(task.title)}
                            </strong>
                            <small>
                                ${taskTypeLabel(task)}
                                ${task.status === "COMPLETED"
                                    ? " · Completada"
                                    : task.status === "ARCHIVED"
                                        ? " · Archivada"
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

        return `
            <aside class="goalDrawer">

                <header class="goalEditorHeader">
                    <h3>Editar objetivo</h3>

                    <button
                        id="closeGoalEditor"
                        type="button"
                        aria-label="Cerrar editor">
                        ×
                    </button>
                </header>

                <form id="goalEditorForm">

                    <label for="goalTitleEdit">
                        Título
                    </label>

                    <input
                        id="goalTitleEdit"
                        type="text"
                        value="${escapeHtml(goal.title)}"
                        maxlength="160"
                        required>

                    <label for="goalDescriptionEdit">
                        Descripción
                    </label>

                    <textarea
                        id="goalDescriptionEdit"
                        rows="6">${escapeHtml(
                            goal.description
                        )}</textarea>

                    <label for="goalDueDateEdit">
                        Fecha límite
                    </label>

                    <input
                        id="goalDueDateEdit"
                        type="date"
                        value="${escapeHtml(
                            goal.dueDate ?? ""
                        )}">

                    <div class="goalEditorActions">

                        <button type="submit">
                            Guardar
                        </button>

                        <button
                            id="completeGoal"
                            type="button">
                            Completar
                        </button>

                        <button
                            id="archiveGoal"
                            type="button">
                            Archivar
                        </button>

                        <button
                            id="deleteGoalFromEditor"
                            type="button"
                            class="dangerAction">
                            Mover a la papelera
                        </button>

                    </div>

                </form>

                <section class="goalSubgoalsSection">

                    <h4>Subobjetivos</h4>

                    <form id="subgoalForm">

                        <input
                            id="subgoalTitle"
                            type="text"
                            placeholder="Nuevo subobjetivo"
                            maxlength="160"
                            required>

                        <button type="submit">
                            Agregar
                        </button>

                    </form>

                </section>

                <section class="goalTasksSection">

                    <h4>Trabajo asociado</h4>

                    <ul class="goalTaskList">
                        ${associatedTaskItems}
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
                                                ${taskTypeLabel(task)}:
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

                <section class="goalHierarchySection">

                    <h4>Organización</h4>

                    ${possibleParents.length > 0
                        ? `
                            <form id="goalParentForm">
                                <select
                                    id="goalParentId"
                                    required>
                                    <option value="">
                                        Mover a otro objetivo…
                                    </option>
                                    ${possibleParents
                                        .map(item => `
                                            <option
                                                value="${escapeHtml(item.id)}"
                                                ${item.id ===
                                                    goal.parentGoalId
                                                    ? "selected"
                                                    : ""}>
                                                ${escapeHtml(item.title)}
                                            </option>
                                        `)
                                        .join("")}
                                </select>
                                <button type="submit">
                                    Mover
                                </button>
                            </form>
                        `
                        : ""}

                    ${goal.parentGoalId
                        ? `
                            <button
                                id="detachGoal"
                                type="button">
                                Convertir en objetivo principal
                            </button>
                        `
                        : ""}

                </section>

            </aside>
        `;

    }

    getDescendantIds(goalId, goals) {

        const result = new Set();
        const pending = [goalId];

        while (pending.length > 0) {

            const parentId = pending.shift();

            for (const goal of goals) {
                if (
                    goal.parentGoalId === parentId &&
                    !result.has(goal.id)
                ) {
                    result.add(goal.id);
                    pending.push(goal.id);
                }
            }

        }

        return result;

    }

}
