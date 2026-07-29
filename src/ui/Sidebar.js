import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";
import { PriorityOptions } from "./PriorityOptions.js";
import { Icon } from "./Icon.js";

export class Sidebar {

    render(
        activeView,
        searchQuery = "",
        areas = [],
        activeAreaId = null,
        contexts = [],
        tags = [],
        taskFilters = {},
        taskSort = "MANUAL",
        canRestoreBackup = false,
        syncConfigured = false,
        syncUrl = "",
        syncRevision = 0,
        syncPendingChanges = false,
        syncLastSuccess = "",
        syncRemoteRevision = null,
        syncRemoteUpdateAvailable = false,
        bulkSelectionMode = false,
        syncInProgress = false,
        syncLastError = null,
        showCompletedTasks = false,
        advancedSearchMode = false,
        advancedSearchError = "",
        customFilters = [],
        currentCustomFilterId = null
    ) {

        // Compatibilidad con llamadas anteriores a la incorporación
        // de activeAreaId como cuarto argumento.
        if (Array.isArray(activeAreaId)) {

            syncLastError = syncInProgress;
            syncInProgress = bulkSelectionMode;
            bulkSelectionMode = syncRemoteUpdateAvailable;
            syncRemoteUpdateAvailable = syncRemoteRevision;
            syncRemoteRevision = syncLastSuccess;
            syncLastSuccess = syncPendingChanges;
            syncPendingChanges = syncRevision;
            syncRevision = syncUrl;
            syncUrl = syncConfigured;
            syncConfigured = canRestoreBackup;
            canRestoreBackup = taskSort;
            taskSort = taskFilters;
            taskFilters = tags;
            tags = contexts;
            contexts = activeAreaId;
            activeAreaId = null;

        }

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
            View.AREA,
            View.COMPLETED,
            View.ARCHIVED,
            View.TRASH
        ];

        const completedToggleViews = [
            View.INBOX,
            View.TODAY,
            View.UPCOMING,
            View.ALL,
            View.AREA,
            View.PROJECT
        ];

        const taskControlViews = [
            ...taskViews,
            View.PROJECT
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

        const filters =
            taskViews.includes(activeView) &&
            !advancedSearchMode
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

                            <button
                                type="submit"
                                class="primaryAction">
                                Aplicar
                            </button>

                            ${Object.values(taskFilters).some(Boolean)
                                ? `
                                    <button
                                        id="clearTaskFilters"
                                        type="button"
                                        class="tertiaryAction">
                                        Limpiar
                                    </button>
                                `
                                : ""}

                        </div>

                    </form>

                </details>
            `
            : "";

        const viewOptions =
            taskViews.includes(activeView) ||
            activeView === View.PROJECT
            ? `
                <details
                    class="taskViewOptions"
                    ${taskSort !== "MANUAL" ||
                        showCompletedTasks
                        ? "open"
                        : ""}>

                    <summary>Vista</summary>

                    <div class="taskViewOptionsBody">

                        ${taskViews.includes(activeView)
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
                            : ""}

                        ${completedToggleViews.includes(
                            activeView
                        )
                            ? `
                                <button
                                    id="toggleCompletedTasks"
                                    type="button"
                                    class="viewOptionButton bulkModeButton ${showCompletedTasks
                                        ? "active"
                                        : ""}">
                                    ${showCompletedTasks
                                        ? "Ocultar completadas"
                                        : "Mostrar completadas"}
                                </button>
                            `
                            : ""}

                    </div>

                </details>
            `
            : "";

        const syncConflict =
            syncRemoteUpdateAvailable &&
            syncPendingChanges;

        const syncStatusClass =
            !syncConfigured
                ? "disconnected"
                : syncLastError
                    ? "error"
                    : syncInProgress
                        ? "syncing"
                        : syncConflict
                            ? "conflict"
                            : syncRemoteUpdateAvailable
                                ? "remote"
                                : syncPendingChanges
                                    ? "pending"
                                    : "configured";

        const syncStatusText =
            !syncConfigured
                ? "Sin configurar"
                : syncLastError
                    ? "Error de sincronización"
                    : syncInProgress
                        ? "Sincronizando…"
                        : syncConflict
                            ? `Conflicto · nube rev. ${syncRemoteRevision}`
                            : syncRemoteUpdateAvailable
                                ? `Actualización disponible · rev. ${syncRemoteRevision}`
                                : syncPendingChanges
                                    ? `Cambios pendientes · rev. ${syncRevision}`
                                    : `Sincronizada · rev. ${syncRevision}`;

        const syncTools = `
            <details
                class="syncTools"
                ${!syncConfigured ||
                    syncPendingChanges ||
                    syncRemoteUpdateAvailable ||
                    syncInProgress ||
                    syncLastError
                    ? "open"
                    : ""}>

                <summary>
                    Sincronización
                    <span class="syncStatus ${syncStatusClass}">
                        ${syncStatusText}
                    </span>
                </summary>

                ${syncLastError
                    ? `
                        <p
                            class="syncErrorHint"
                            title="${escapeHtml(syncLastError)}">
                            Los cambios continúan guardados localmente. La aplicación volverá a intentarlo después de un nuevo cambio o al recuperar el foco.
                        </p>
                    `
                    : ""}

                <form id="syncConfigForm">

                    <label for="syncUrl">
                        URL de Apps Script
                    </label>

                    <input
                        id="syncUrl"
                        type="url"
                        value="${escapeHtml(syncUrl)}"
                        placeholder="https://script.google.com/.../exec"
                        autocomplete="off"
                        required>

                    <label for="syncToken">
                        Token privado
                    </label>

                    <input
                        id="syncToken"
                        type="password"
                        placeholder="${syncConfigured
                            ? "Dejar vacío para conservarlo"
                            : "Token de sincronización"}"
                        autocomplete="new-password">

                    <button
                        type="submit"
                        class="primaryAction">
                        Guardar conexión
                    </button>

                </form>

                ${syncConfigured
                    ? `
                        <p class="syncLastSuccess">
                            Última sincronización:
                            ${syncLastSuccess
                                ? this.formatSyncDate(
                                    syncLastSuccess
                                )
                                : "todavía no registrada"}
                        </p>

                        <div class="syncActions">

                            ${syncPendingChanges &&
                                syncRemoteUpdateAvailable
                                ? `
                                    <p class="syncConflictHint">
                                        Elegí qué versión querés conservar.
                                    </p>

                                    <button
                                        id="pullFromCloud"
                                        type="button">
                                        Conservar versión de la nube
                                    </button>

                                    <button
                                        id="overwriteCloud"
                                        type="button"
                                        class="dangerAction">
                                        Conservar versión local
                                    </button>
                                `
                                : `
                                    <button
                                        id="pushToCloud"
                                        type="button"
                                        class="secondaryAction">
                                        Subir a la nube
                                    </button>

                                    <button
                                        id="pullFromCloud"
                                        type="button"
                                        class="secondaryAction">
                                        Descargar de la nube
                                    </button>
                                `}

                            <button
                                id="clearSyncConfig"
                                type="button"
                                class="tertiaryAction">
                                Quitar conexión
                            </button>

                        </div>
                    `
                    : ""}

            </details>
        `;

        const backupTools = `
            <details class="backupTools">

                <summary>Copia de seguridad</summary>

                <div class="backupActions">

                    <button
                        id="exportBackup"
                        type="button"
                        class="secondaryAction">
                        Descargar copia
                    </button>

                    <label
                        class="importBackupButton secondaryAction"
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
                                type="button"
                                class="secondaryAction">
                                Deshacer última importación
                            </button>
                        `
                        : ""}

                </div>

            </details>
        `;

        return `
            <aside
                id="appSidebar"
                class="sidebar"
                aria-label="Navegación principal">

                <h3>Task Engine</h3>

                <button
                    id="openTaskCreation"
                    type="button"
                    class="newTaskButton createActionButton"
                    aria-label="Nueva tarea"
                    title="Nueva tarea">
                    <span class="createActionIcon">
                        ${Icon.render("plus")}
                    </span>
                    <span class="createActionLabel">
                        Nueva tarea
                    </span>
                </button>

                ${taskControlViews.includes(activeView)
                    ? `
                <form
                    id="taskSearchForm"
                    class="taskSearch ${advancedSearchMode
                        ? "advanced"
                        : ""}">

                    <input
                        id="taskSearchInput"
                        type="search"
                        value="${escapeHtml(searchQuery)}"
                        placeholder="${advancedSearchMode
                            ? "Ej.: prioridad:alta AND fecha:hoy"
                            : "Buscar tareas"}"
                        aria-describedby="${advancedSearchMode
                            ? "advancedSearchHelp"
                            : ""}"
                        autocomplete="off">

                    ${advancedSearchMode
                        ? `
                            <p id="advancedSearchHelp">
                                Usá AND, OR, NOT, paréntesis y criterios específicos.
                            </p>

                            <details class="advancedSearchReference">
                                <summary>Ver criterios disponibles</summary>

                                <p><strong>Contenido:</strong> titulo, descripcion.</p>
                                <p><strong>Organización:</strong> area, areaContiene, contexto, contextoContiene, etiqueta, etiquetaContiene.</p>
                                <p><strong>Fechas:</strong> fecha, fechaAntes, fechaDespues, fechaDentro, fechaEntre, completada, creada, actualizada y sus variantes Entre.</p>
                                <p><strong>Propiedades:</strong> prioridad, estado, tieneFecha, tieneEtiquetas, tieneSubtareas, esSubtarea, recurrente, repeticion, posposiciones.</p>
                                <p><strong>Valores útiles:</strong> hoy, ayer, mañana, viernes, “en 3 dias”, 15/08, &gt;3 y rangos entre fechas.</p>
                            </details>
                        `
                        : ""}

                    ${advancedSearchError
                        ? `
                            <p
                                class="advancedSearchError"
                                role="alert">
                                ${escapeHtml(advancedSearchError)}
                            </p>
                        `
                        : ""}

                    <div class="taskSearchActions">

                        <button
                            type="submit"
                            class="primaryAction">
                            Buscar
                        </button>

                        ${advancedSearchMode &&
                            searchQuery.trim() &&
                            !advancedSearchError
                            ? `
                                <button
                                    id="saveCustomFilter"
                                    type="button"
                                    class="secondaryAction">
                                    Guardar filtro
                                </button>
                            `
                            : ""}

                        ${searchQuery
                            ? `
                                <button
                                    id="clearTaskSearch"
                                    type="button"
                                    class="tertiaryAction">
                                    Limpiar
                                </button>
                            `
                            : ""}

                    </div>

                </form>

                <button
                    id="toggleAdvancedSearch"
                    type="button"
                    class="advancedSearchToggle ${advancedSearchMode
                        ? "active"
                        : ""}"
                    aria-pressed="${advancedSearchMode}">
                    ${advancedSearchMode
                        ? "Búsqueda avanzada activa"
                        : "Usar búsqueda avanzada"}
                </button>

                ${filters}

                ${viewOptions}

                ${taskViews.includes(activeView)
                    ? `
                        <button
                            id="toggleBulkMode"
                            type="button"
                            class="bulkModeButton ${bulkSelectionMode
                                ? "active"
                                : ""}">
                            ${bulkSelectionMode
                                ? "Salir de selección"
                                : "Selección múltiple"}
                        </button>
                    `
                    : ""}

                    `
                    : ""}

                <nav>

                    <span class="sidebarSectionLabel">
                        Ejecución
                    </span>

                    <button
                        id="showToday"
                        class="${buttonClass(View.TODAY)}">
                        Hoy
                    </button>

                    <button
                        id="showInbox"
                        class="${buttonClass(View.INBOX)}">
                        Inbox
                    </button>

                    <button
                        id="showUpcoming"
                        class="${buttonClass(View.UPCOMING)}">
                        Próximas
                    </button>

                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>

                    <button
                        id="showAll"
                        class="${buttonClass(View.ALL)}">
                        Todas
                    </button>

                    <button
                        id="showGoals"
                        class="${buttonClass(View.GOALS)}">
                        Objetivos
                    </button>

                    ${areas.length > 0
                        ? `
                            <details
                                class="sidebarNavigationGroup sidebarAreaGroup"
                                ${activeView === View.AREA
                                    ? "open"
                                    : ""}>
                                <summary>
                                    Áreas
                                </summary>

                                <div class="sidebarAreaViews">

                                ${areas.map(area => `
                                    <button
                                        type="button"
                                        class="sidebarButton showAreaView ${activeView ===
                                            View.AREA &&
                                            activeAreaId ===
                                                area.id
                                            ? "active"
                                            : ""}"
                                        data-id="${escapeHtml(area.id)}">

                                        <span
                                            class="sidebarAreaColor"
                                            style="--area-color: ${escapeHtml(area.color)}">
                                        </span>

                                        <span>
                                            ${escapeHtml(area.name)}
                                        </span>

                                    </button>
                                `).join("")}

                                </div>
                            </details>
                        `
                        : ""}

                    ${customFilters.length > 0
                        ? `
                            <details
                                class="customFiltersSection"
                                ${currentCustomFilterId
                                    ? "open"
                                    : ""}>

                                <summary>
                                    Filtros personalizados
                                </summary>

                                <div class="customFilterList">
                                    ${customFilters.map(filter => `
                                        <div class="customFilterItem">

                                            <div class="customFilterDisplay">
                                                <button
                                                    type="button"
                                                    class="showCustomFilter ${filter.id ===
                                                        currentCustomFilterId
                                                        ? "active"
                                                        : ""}"
                                                    data-id="${escapeHtml(filter.id)}"
                                                    title="${escapeHtml(filter.query)}">
                                                    ${escapeHtml(filter.name)}
                                                </button>

                                                <button
                                                    type="button"
                                                    class="renameCustomFilter"
                                                    data-id="${escapeHtml(filter.id)}"
                                                    aria-label="Renombrar ${escapeHtml(filter.name)}"
                                                    title="Renombrar filtro">
                                                    ✎
                                                </button>

                                                <button
                                                    type="button"
                                                    class="deleteCustomFilter"
                                                    data-id="${escapeHtml(filter.id)}"
                                                    aria-label="Eliminar ${escapeHtml(filter.name)}"
                                                    title="Eliminar filtro">
                                                    ×
                                                </button>
                                            </div>

                                            <form
                                                class="customFilterRenameForm"
                                                data-id="${escapeHtml(filter.id)}"
                                                hidden>
                                                <input
                                                    class="customFilterRenameInput"
                                                    type="text"
                                                    value="${escapeHtml(filter.name)}"
                                                    maxlength="80"
                                                    required>
                                                <button type="submit">
                                                    Guardar
                                                </button>
                                                <button
                                                    type="button"
                                                    class="cancelCustomFilterRename">
                                                    Cancelar
                                                </button>
                                            </form>

                                        </div>
                                    `).join("")}
                                </div>

                            </details>
                        `
                        : ""}

                    <details
                        class="sidebarNavigationGroup"
                        ${[
                            View.COMPLETED,
                            View.ARCHIVED,
                            View.TRASH
                        ].includes(activeView)
                            ? "open"
                            : ""}>
                        <summary>Historial</summary>

                        <div class="sidebarNavigationGroupBody">
                            <button
                                id="showCompleted"
                                class="${buttonClass(View.COMPLETED)}">
                                Completadas
                            </button>

                            <button
                                id="showArchived"
                                class="${buttonClass(View.ARCHIVED)}">
                                Archivadas
                            </button>

                            <button
                                id="showTrash"
                                class="${buttonClass(View.TRASH)}">
                                Papelera
                            </button>
                        </div>
                    </details>

                    <details
                        class="sidebarNavigationGroup"
                        ${[
                            View.AREAS,
                            View.CONTEXTS,
                            View.TAGS
                        ].includes(activeView)
                            ? "open"
                            : ""}>
                        <summary>Organización</summary>

                        <div class="sidebarNavigationGroupBody">
                            <button
                                id="manageAreas"
                                class="${buttonClass(View.AREAS)}">
                                Áreas
                            </button>

                            <button
                                id="manageContexts"
                                class="${buttonClass(View.CONTEXTS)}">
                                Contextos
                            </button>

                            <button
                                id="manageTags"
                                class="${buttonClass(View.TAGS)}">
                                Etiquetas
                            </button>
                        </div>
                    </details>

                </nav>

                <div class="sidebarSystemTools">
                    ${syncTools}
                    ${backupTools}
                </div>

            </aside>
        `;

    }


    formatSyncDate(value) {

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "fecha inválida";
        }

        return new Intl.DateTimeFormat(
            "es-AR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        ).format(date);

    }

}
