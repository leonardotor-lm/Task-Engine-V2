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

        const directSubgoalCount = goals.filter(
            item =>
                item.parentGoalId === goal.id &&
                item.status !== "DELETED"
        ).length;

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
            <aside class="goalDrawer goalEditorCompactLayout">

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

                <form
                    id="goalEditorForm"
                    class="goalEditorPrimary">

                    <label
                        class="goalEditorVisuallyHidden"
                        for="goalTitleEdit">
                        Título
                    </label>

                    <input
                        id="goalTitleEdit"
                        type="text"
                        value="${escapeHtml(goal.title)}"
                        maxlength="160"
                        required>

                    <label
                        class="goalEditorVisuallyHidden"
                        for="goalDescriptionEdit">
                        Descripción
                    </label>

                    <textarea
                        id="goalDescriptionEdit"
                        rows="2"
                        placeholder="Descripción">${escapeHtml(
                            goal.description
                        )}</textarea>

                    <div class="goalEditorPlanning">
                        <label for="goalDueDateEdit">
                            Fecha límite
                        </label>

                        <input
                            id="goalDueDateEdit"
                            type="date"
                            value="${escapeHtml(
                                goal.dueDate ?? ""
                            )}">
                    </div>

                </form>

                <div
                    class="goalEditorToolGrid"
                    data-goal-tool-order="Notas,Asociaciones,Subobjetivos,Organización">

                    <details
                        id="notionGoalNotesSection"
                        class="editorSection editorNotionGoalSection goalEditorTool"
                        data-mobile-collapsed="true">
                        <summary
                            class="goalEditorToolSummary"
                            aria-label="Notas"
                            title="Notas">
                            ${Icon.render("note", "goalEditorToolIcon")}
                            <span class="goalEditorToolLabel">Notas</span>
                            <span class="goalEditorToolCount">
                                ${goal.notionPageId ? 1 : 0}
                            </span>
                        </summary>

                        <div class="goalEditorToolPanel">
                            <header class="goalEditorToolPanelHeader">
                                <strong>Notas</strong>
                                <button
                                    type="button"
                                    class="goalEditorToolPanelClose iconButton"
                                    aria-label="Cerrar Notas"
                                    title="Cerrar Notas">
                                    ${Icon.render("close")}
                                </button>
                            </header>

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
                        </div>
                    </details>

                    <details
                        class="goalAssociationManager goalEditorTool">
                        <summary
                            class="goalEditorToolSummary"
                            aria-label="Asociaciones"
                            title="Asociaciones">
                            ${Icon.render("link", "goalEditorToolIcon")}
                            <span class="goalEditorToolLabel">Asociaciones</span>
                            <span class="goalEditorToolCount">
                                ${directlyAssociated.length}
                            </span>
                        </summary>

                        <div class="goalEditorToolPanel">
                            <header class="goalEditorToolPanelHeader">
                                <strong>Gestionar asociaciones</strong>
                                <button
                                    type="button"
                                    class="goalEditorToolPanelClose iconButton"
                                    aria-label="Cerrar Asociaciones"
                                    title="Cerrar Asociaciones">
                                    ${Icon.render("close")}
                                </button>
                            </header>

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
                        </div>
                    </details>

                    <details class="goalSubgoalsSection goalEditorTool">
                        <summary
                            class="goalEditorToolSummary"
                            aria-label="Subobjetivos"
                            title="Subobjetivos">
                            ${Icon.render("target", "goalEditorToolIcon")}
                            <span class="goalEditorToolLabel">Subobjetivos</span>
                            <span class="goalEditorToolCount">
                                ${directSubgoalCount}
                            </span>
                        </summary>

                        <div class="goalEditorToolPanel">
                            <header class="goalEditorToolPanelHeader">
                                <strong>Subobjetivos</strong>
                                <button
                                    type="button"
                                    class="goalEditorToolPanelClose iconButton"
                                    aria-label="Cerrar Subobjetivos"
                                    title="Cerrar Subobjetivos">
                                    ${Icon.render("close")}
                                </button>
                            </header>

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
                        </div>
                    </details>

                    ${possibleParents.length > 0 ||
                        goal.parentGoalId
                        ? `
                    <details class="goalHierarchySection goalEditorTool">

                        <summary
                            class="goalEditorToolSummary"
                            aria-label="Organización"
                            title="Organización">
                            ${Icon.render(
                                "corner-down-right",
                                "goalEditorToolIcon"
                            )}
                            <span class="goalEditorToolLabel">Organización</span>
                        </summary>

                        <div class="goalEditorToolPanel">
                            <header class="goalEditorToolPanelHeader">
                                <strong>Organización</strong>
                                <button
                                    type="button"
                                    class="goalEditorToolPanelClose iconButton"
                                    aria-label="Cerrar Organización"
                                    title="Cerrar Organización">
                                    ${Icon.render("close")}
                                </button>
                            </header>

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
                        </div>

                    </details>
                        `
                        : ""}

                </div>

                <footer class="goalEditorFooter">
                    <div class="goalEditorAdministrativeActions">
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
                            Eliminar
                        </button>
                    </div>

                    <div class="goalEditorPrimaryActions">
                        <button
                            id="completeGoal"
                            type="button"
                            class="secondaryAction">
                            Completar
                        </button>

                        <button
                            type="submit"
                            class="primaryAction"
                            form="goalEditorForm">
                            Guardar cambios
                        </button>
                    </div>
                </footer>

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

        this.bindToolPanels();

    }

    bindToolPanels() {

        this.panelAbortController?.abort();
        this.panelAbortController =
            new AbortController();

        const signal =
            this.panelAbortController.signal;
        const drawer = document.querySelector(
            ".goalEditorCompactLayout"
        );

        if (!drawer) return;

        const tools = [...drawer.querySelectorAll(
            ".goalEditorTool"
        )];

        const closeTool = (
            tool,
            restoreFocus = false
        ) => {

            tool.open = false;

            if (restoreFocus) {
                tool.querySelector(
                    ":scope > summary"
                )?.focus();
            }

        };

        for (const tool of tools) {

            tool.addEventListener(
                "toggle",
                () => {

                    if (!tool.open) return;

                    for (const other of tools) {
                        if (other !== tool) {
                            other.open = false;
                        }
                    }

                },
                { signal }
            );

            tool.querySelector(
                ".goalEditorToolPanelClose"
            )?.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    event.stopPropagation();
                    closeTool(tool, true);
                },
                { signal }
            );

        }

        document.addEventListener(
            "keydown",
            event => {

                if (event.key !== "Escape") return;

                const openTool = tools.find(
                    tool => tool.open
                );

                if (!openTool) return;

                event.preventDefault();
                closeTool(openTool, true);

            },
            { signal }
        );

        document.addEventListener(
            "click",
            event => {

                const openTool = tools.find(
                    tool => tool.open
                );

                if (
                    !openTool ||
                    openTool.contains(event.target)
                ) {
                    return;
                }

                closeTool(openTool);

            },
            { signal }
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
