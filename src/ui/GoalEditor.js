import { escapeHtml } from "./escapeHtml.js";

export class GoalEditor {

    render(goal) {

        if (!goal) return "";

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

            </aside>
        `;

    }

}
