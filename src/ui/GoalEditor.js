import { escapeHtml } from "./escapeHtml.js";
import { SearchableSelect } from "./SearchableSelect.js";
import { Icon } from "./Icon.js";

export class GoalEditor {

    constructor() {
        this.searchableSelect =
            new SearchableSelect();
    }

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

        const directlyAssociated = tasks.filter(
            task =>
                !task.isDeleted() &&
                (task.goalIds ?? []).includes(goal.id)
        );

        const availableTasks = tasks.filter(
            task =>
                (
                    task.status === "INBOX" ||
                    task.status === "PENDING"
                ) &&
                !(task.goalIds ?? []).includes(goal.id)
        );

        const taskIdsWithChildren = new Set(
            tasks
                .filter(task => task.parentTaskId !== null)
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

        return `
            <aside class="goalDrawer">

                <header class="goalEditorHeader">
                    <h3>Editar objetivo</h3>

                    <button
                        type="submit"
                        form="goalEditorForm"
                        class="mobileGoalEditorSave iconButton"
                        aria-label="Guardar objetivo"
                        title="Guardar objetivo">
                        ${Icon.render("save")}
                    </button>

                    <button
                        id="closeGoalEditor"
                        type="button"
                        class="iconButton"
                        aria-label="Cerrar editor"
                        title="Cerrar editor">
                        ${Icon.render("close")}
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
                        rows="4">${escapeHtml(
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

                        <button
                            type="submit"
                            class="primaryAction">
                            Guardar
                        </button>

                        <button
                            id="completeGoal"
                            type="button"
                            class="secondaryAction">
                            Completar
                        </button>

                        <button
                            id="archiveGoal"
                            type="button"
                            class="tertiaryAction">
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

                <details
                    id="notionGoalNotesSection"
                    class="editorSection editorNotionGoalSection"
                    data-mobile-collapsed="true">
                    <summary>Notas</summary>
                    <div
                        id="notionGoalNotesBody"
                        class="editorSectionBody"
                        data-goal-id="${escapeHtml(goal.id)}">
                        <p class="fieldHelp">
                            La nota se edita en Notion. Task Engine guarda solamente el vínculo.
                        </p>
                        ${goal.notionPageId && goal.notionPageUrl
                            ? `
                                <div class="taskEditorActions">
                                    <a
                                        id="openNotionGoalNote"
                                        class="secondaryAction"
                                        href="${escapeHtml(goal.notionPageUrl)}"
                                        target="_blank"
                                        rel="noopener noreferrer">
                                        Abrir nota
                                    </a>
                                    <button
                                        id="unlinkNotionGoalNote"
                                        type="button"
                                        class="tertiaryAction">
                                        Desvincular
                                    </button>
                                </div>
                            `
                            : goal.status === "DELETED"
                                ? `
                                    <p class="fieldHelp">
                                        No se puede crear una nota nueva para un objetivo en Papelera.
                                    </p>
                                `
                                : `
                                    <button
                                        id="createNotionGoalNote"
                                        type="button"
                                        class="secondaryAction">
                                        Crear nota
                                    </button>
                                `}
                    </div>
                </details>

                <section class="goalTasksSection">

                    <details class="goalAssociationManager">
                        <summary>
                            Gestionar asociaciones
                            (${directlyAssociated.length})
                        </summary>

                        <div class="goalAssociationManagerBody">

                            ${directlyAssociated.length > 0
                                ? `
                                    <form id="goalTaskDetachForm">
                                        ${this.searchableSelect.render({
                                            id: "goalTaskDetachId",
                                            label: "Quitar asociación",
                                            placeholder:
                                                "Buscar entre las asociadas…",
                                            options: directlyAssociated
                                                .map(task => ({
                                                    value: task.id,
                                                    label:
                                                        `${typeLabel(task)}: ` +
                                                        task.title
                                                }))
                                        })}
                                        <button
                                            type="submit"
                                            class="dangerAction">
                                            Quitar
                                        </button>
                                    </form>
                                `
                                : `
                                    <p class="emptyGoalTasks">
                                        No hay asociaciones directas.
                                    </p>
                                `}

                            ${availableTasks.length > 0
                                ? `
                                    <form id="goalTaskForm">
                                        ${this.searchableSelect.render({
                                            id: "goalTaskId",
                                            label: "Agregar asociación",
                                            placeholder:
                                                "Buscar tareas o proyectos…",
                                            options: availableTasks
                                                .map(task => ({
                                                    value: task.id,
                                                    label:
                                                        `${typeLabel(task)}: ` +
                                                        task.title
                                                }))
                                        })}
                                        <button type="submit">
                                            Asociar
                                        </button>
                                    </form>
                                `
                                : `
                                    <p class="emptyGoalTasks">
                                        No hay más tareas o proyectos disponibles.
                                    </p>
                                `}

                        </div>
                    </details>

                </section>

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
                <details class="goalHierarchySection">

                    <summary>
                        Organización
                    </summary>

                    <div class="goalHierarchySectionBody">

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

                    </div>

                </details>
                    `
                    : ""}

            </aside>
        `;

    }

    bindAssociationSelectors() {

        this.searchableSelect.bind(
            "goalTaskDetachId"
        );
        this.searchableSelect.bind(
            "goalTaskId"
        );

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
