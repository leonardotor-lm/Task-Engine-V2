import { escapeHtml } from "./escapeHtml.js";

export class GoalEditor {

    render(
        goal,
        goals = []
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

                ${possibleParents.length > 0 ||
                    goal.parentGoalId
                    ? `
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
                    `
                    : ""}

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
