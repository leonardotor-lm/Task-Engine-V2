import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";
import { PriorityOptions } from "./PriorityOptions.js";

export class Sidebar {

    render(
        activeView,
        searchQuery = "",
        areas = [],
        contexts = [],
        tags = [],
        taskFilters = {},
        taskSort = "MANUAL",
        canRestoreBackup = false
    ) {

        const buttonClass = view => {

            return activeView === view
                ? "sidebarButton active"
                : "sidebarButton";

        };

        const taskViews = [
            View.INBOX,
            View.TODAY,
            View.UPCOMING,
            View.ALL,
            View.COMPLETED,
            View.ARCHIVED,
            View.TRASH
        ];

        const optionList = (
            entities,
            selectedId
        ) => {

            return entities.map(entity => `
                <option
                    value="${escapeHtml(entity.id)}"
                    ${entity.id === selectedId
                        ? "selected"
                        : ""}>
                    ${escapeHtml(entity.name)}
                </option>
            `).join("");

        };

        const priorityOptions = PriorityOptions.map(
            option => `
                <option
                    value="${option.value}"
                    ${String(option.value) ===
                        String(taskFilters.priority)
                        ? "selected"
                        : ""}>
                    ${escapeHtml(option.label)}
                </option>
            `
        ).join("");

        const filters = taskViews.includes(activeView)
            ? `
                <details
                    class="taskFilters"
                    ${Object.values(taskFilters).some(Boolean)
                        ? "open"
                        : ""}>

                    <summary>Filtros</summary>

                    <form id="taskFilterForm">

                        <label for="filterArea">Área</label>
                        <select id="filterArea">
                            <option value="">Todas</option>
                            ${optionList(
                                areas,
                                taskFilters.areaId
                            )}
                        </select>

                        <label for="filterContext">
                            Contexto
                        </label>
                        <select id="filterContext">
                            <option value="">Todos</option>
                            ${optionList(
                                contexts,
                                taskFilters.contextId
                            )}
                        </select>

                        <label for="filterTag">
                            Etiqueta
                        </label>
                        <select id="filterTag">
                            <option value="">Todas</option>
                            ${optionList(
                                tags,
                                taskFilters.tagId
                            )}
                        </select>

                        <label for="filterPriority">
                            Prioridad
                        </label>
                        <select id="filterPriority">
                            <option value="">
                                Cualquiera
                            </option>
                            ${priorityOptions}
                        </select>

                        <label for="filterDue">Fecha</label>
                        <select id="filterDue">
                            <option value="">Cualquiera</option>
                            <option
                                value="TODAY"
                                ${taskFilters.due === "TODAY"
                                    ? "selected"
                                    : ""}>
                                Hoy
                            </option>
                            <option
                                value="OVERDUE"
                                ${taskFilters.due === "OVERDUE"
                                    ? "selected"
                                    : ""}>
                                Atrasadas
                            </option>
                            <option
                                value="UPCOMING"
                                ${taskFilters.due === "UPCOMING"
                                    ? "selected"
                                    : ""}>
                                Próximas
                            </option>
                            <option
                                value="NO_DATE"
                                ${taskFilters.due === "NO_DATE"
                                    ? "selected"
                                    : ""}>
                                Sin fecha
                            </option>
                        </select>

                        <div class="taskFilterActions">

                            <button type="submit">
                                Aplicar
                            </button>

                            ${Object.values(taskFilters).some(Boolean)
                                ? `
                                    <button
                                        id="clearTaskFilters"
                                        type="button">
                                        Limpiar
                                    </button>
                                `
                                : ""}

                        </div>

                    </form>

                </details>
            `
            : "";

        const sorting = taskViews.includes(activeView)
            ? `
                <div class="taskSorting">

                    <label for="taskSort">
                        Ordenar por
                    </label>

                    <select id="taskSort">

                        <option
                            value="MANUAL"
                            ${taskSort === "MANUAL"
                                ? "selected"
                                : ""}>
                            Orden manual
                        </option>

                        <option
                            value="DUE_DATE"
                            ${taskSort === "DUE_DATE"
                                ? "selected"
                                : ""}>
                            Vencimiento próximo
                        </option>

                        <option
                            value="PRIORITY"
                            ${taskSort === "PRIORITY"
                                ? "selected"
                                : ""}>
                            Prioridad
                        </option>

                        <option
                            value="CREATED_NEWEST"
                            ${taskSort === "CREATED_NEWEST"
                                ? "selected"
                                : ""}>
                            Más recientes
                        </option>

                        <option
                            value="CREATED_OLDEST"
                            ${taskSort === "CREATED_OLDEST"
                                ? "selected"
                                : ""}>
                            Más antiguas
                        </option>

                    </select>

                </div>
            `
            : "";

        const backupTools = `
            <details class="backupTools">

                <summary>Copia de seguridad</summary>

                <div class="backupActions">

                    <button
                        id="exportBackup"
                        type="button">
                        Descargar copia
                    </button>

                    <label
                        class="importBackupButton"
                        for="importBackup">
                        Importar copia
                    </label>

                    <input
                        id="importBackup"
                        class="visuallyHidden"
                        type="file"
                        accept=".json,application/json">

                    ${canRestoreBackup
                        ? `
                            <button
                                id="restoreLastImportBackup"
                                type="button">
                                Deshacer última importación
                            </button>
                        `
                        : ""}

                </div>

            </details>
        `;

        return `
            <aside class="sidebar">

                <h3>Task Engine</h3>

                <form id="taskSearchForm" class="taskSearch">

                    <input
                        id="taskSearchInput"
                        type="search"
                        value="${escapeHtml(searchQuery)}"
                        placeholder="Buscar tareas"
                        autocomplete="off">

                    <div class="taskSearchActions">

                        <button type="submit">
                            Buscar
                        </button>

                        ${searchQuery
                            ? `
                                <button
                                    id="clearTaskSearch"
                                    type="button">
                                    Limpiar
                                </button>
                            `
                            : ""}

                    </div>

                </form>

                ${filters}

                ${sorting}

                ${backupTools}

                <nav>

                    <button
                        id="showInbox"
                        class="${buttonClass(View.INBOX)}">
                        📥 Inbox
                    </button>

                    <button
                        id="showToday"
                        class="${buttonClass(View.TODAY)}">
                        📅 Hoy
                    </button>

                    <button
                        id="showUpcoming"
                        class="${buttonClass(View.UPCOMING)}">
                        📆 Próximas
                    </button>

                    <button
                        id="showAll"
                        class="${buttonClass(View.ALL)}">
                        📋 Todas
                    </button>

                    <hr>

                    <button
                        id="showCompleted"
                        class="${buttonClass(View.COMPLETED)}">
                        ✅ Completadas
                    </button>

                    <button
                        id="showArchived"
                        class="${buttonClass(View.ARCHIVED)}">
                        🗄️ Archivadas
                    </button>

                    <button
                        id="showTrash"
                        class="${buttonClass(View.TRASH)}">
                        🗑️ Papelera
                    </button>

                    <hr>

                    <button
                        id="manageAreas"
                        class="${buttonClass(View.AREAS)}">
                        ⚙️ Áreas
                    </button>

                    <button
                        id="manageContexts"
                        class="${buttonClass(View.CONTEXTS)}">
                        ⚙️ Contextos
                    </button>

                    <button
                        id="manageTags"
                        class="${buttonClass(View.TAGS)}">
                        🏷️ Etiquetas
                    </button>

                </nav>

            </aside>
        `;

    }

}
