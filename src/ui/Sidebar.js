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
        taskFilters = {}
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
