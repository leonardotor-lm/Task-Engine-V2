import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";
import { PriorityOptions } from "./PriorityOptions.js";
import { Icon } from "./Icon.js";
import { EntityManager } from "./EntityManager.js";

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
        currentCustomFilterId = null,
        taskViewCounts = {},
        advancedSearchDialogOpen = false,
        taskToolsDialogOpen = false,
        showTaskMetadata = true,
        settingsDialogOpen = false,
        settingsSection = null
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

        const count = key => `
            <span class="sidebarTaskCount">
                (${taskViewCounts[key] ?? 0})
            </span>
        `;

        const taskViews = [
            View.INBOX,
            View.TODAY,
            View.TOMORROW,
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
            View.TOMORROW,
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
                <section class="taskToolsSection taskFilters">

                    <h3>Filtros</h3>

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

                    </form>

                </section>
            `
            : "";

        const viewOptions =
            taskViews.includes(activeView)
            ? `
                <section class="taskToolsSection taskViewOptions">

                    <h3>Orden</h3>

                    <div class="taskViewOptionsBody">

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

                    </div>

                </section>
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

        const sidebarSyncStatusText = {
            disconnected: "Desconectado",
            error: "Error de sincronización",
            syncing: "Sincronizando…",
            conflict: "Conflicto de sincronización",
            remote: "Actualización disponible",
            pending: "Cambios pendientes",
            configured: "Sincronizado"
        }[syncStatusClass];

        const syncTools = `
            <section class="syncTools settingsToolPanel">

                <header class="settingsToolHeader">
                    <h3>
                    Sincronización
                    </h3>
                    <span class="syncStatus ${syncStatusClass}">
                        ${syncStatusText}
                    </span>
                </header>

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

            </section>
        `;

        const backupTools = `
            <section class="backupTools settingsToolPanel">

                <h3>Copia de seguridad</h3>

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

            </section>
        `;

        const organizationTools = `
            <section class="settingsToolPanel organizationTools">

                <h3>Organización</h3>

                <div class="settingsOrganizationActions">
                    <button
                        class="openSettingsSection"
                        data-section="areas"
                        type="button">
                        Áreas
                    </button>

                    <button
                        class="openSettingsSection"
                        data-section="contexts"
                        type="button">
                        Contextos
                    </button>

                    <button
                        class="openSettingsSection"
                        data-section="tags"
                        type="button">
                        Etiquetas
                    </button>
                </div>

            </section>
        `;

        const settingsSectionTitles = {
            organization: "Organización",
            areas: "Áreas",
            contexts: "Contextos",
            tags: "Etiquetas",
            sync: "Sincronización",
            backup: "Copia de seguridad"
        };

        const entityManager = new EntityManager();

        const settingsSectionContent = {
            organization: organizationTools,
            areas: entityManager.render(
                "Áreas",
                areas,
                {
                    embedded: true,
                    reorderable: true
                }
            ),
            contexts: entityManager.render(
                "Contextos",
                contexts,
                { embedded: true }
            ),
            tags: entityManager.render(
                "Etiquetas",
                tags,
                { embedded: true }
            ),
            sync: syncTools,
            backup: backupTools
        };

        const activeSettingsTitle =
            settingsSectionTitles[settingsSection] ||
            "Configuración";

        const activeSettingsContent =
            settingsSectionContent[settingsSection] ||
            `
                <div class="settingsMenu">
                    <button
                        type="button"
                        class="openSettingsSection"
                        data-section="organization">
                        Organización
                    </button>

                    <button
                        type="button"
                        class="openSettingsSection"
                        data-section="sync">
                        Sincronización
                    </button>

                    <button
                        type="button"
                        class="openSettingsSection"
                        data-section="backup">
                        Copia de seguridad
                    </button>
                </div>
            `;

        return `
            <aside
                id="appSidebar"
                class="sidebar"
                aria-label="Navegación principal">

                <div class="sidebarBrand">
                    <h3>Mis tareas</h3>

                    <span
                        class="sidebarSyncStatus ${syncStatusClass}"
                        role="status"
                        aria-live="polite"
                        title="${escapeHtml(syncStatusText)}">
                        <span
                            class="sidebarSyncStatusDot"
                            aria-hidden="true">
                        </span>
                        <span>${sidebarSyncStatusText}</span>
                    </span>
                </div>

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
                    class="taskSearch">

                    <div class="taskSearchField">

                        <button
                            type="submit"
                            class="taskSearchSubmit iconButton"
                            aria-label="Buscar tareas"
                            title="Buscar">
                            ${Icon.render("search")}
                        </button>

                        <input
                            id="taskSearchInput"
                            type="search"
                            value="${advancedSearchMode
                                ? ""
                                : escapeHtml(searchQuery)}"
                            placeholder="Buscar tareas"
                            autocomplete="off">

                        ${!advancedSearchMode &&
                            searchQuery
                            ? `
                                <button
                                    id="clearTaskSearch"
                                    type="button"
                                    class="taskSearchClear iconButton"
                                    aria-label="Limpiar búsqueda"
                                    title="Limpiar búsqueda">
                                    ${Icon.render("close")}
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
                        ? "Editar búsqueda avanzada"
                        : "Búsqueda avanzada"}
                </button>

                <dialog
                    id="advancedSearchDialog"
                    class="advancedSearchDialog"
                    aria-labelledby="advancedSearchTitle"
                    data-requested-open="${advancedSearchDialogOpen}">

                    <div class="advancedSearchDialogHeader">

                        <h2 id="advancedSearchTitle">
                            Búsqueda avanzada
                        </h2>

                        <button
                            id="closeAdvancedSearch"
                            type="button"
                            class="iconButton"
                            aria-label="Cerrar búsqueda avanzada"
                            title="Cerrar">
                            ${Icon.render("close")}
                        </button>

                    </div>

                    <form id="advancedSearchForm">

                        <label for="advancedSearchInput">
                            Criterios
                        </label>

                        <input
                            id="advancedSearchInput"
                            type="search"
                            value="${advancedSearchMode
                                ? escapeHtml(searchQuery)
                                : ""}"
                            placeholder="Ej.: prioridad:alta AND fecha:hoy"
                            aria-describedby="advancedSearchHelp"
                            autocomplete="off"
                            autofocus>

                        <p id="advancedSearchHelp">
                            Usá AND, OR, NOT, paréntesis y criterios específicos.
                        </p>

                        ${advancedSearchError
                            ? `
                                <p
                                    class="advancedSearchError"
                                    role="alert">
                                    ${escapeHtml(advancedSearchError)}
                                </p>
                            `
                            : ""}

                        <details class="advancedSearchReference">
                            <summary>Ver criterios disponibles</summary>

                            <p><strong>Contenido:</strong> titulo, descripcion.</p>
                            <p><strong>Organización:</strong> area, areaContiene, contexto, contextoContiene, etiqueta, etiquetaContiene, objetivo, objetivoJerarquia, objetivoDescripcion, objetivoEstado, objetivoFecha, objetivoNivel.</p>
                            <p><strong>Fechas:</strong> fecha, fechaAntes, fechaDespues, fechaDentro, fechaEntre, completada, creada, actualizada y sus variantes Entre.</p>
                            <p><strong>Propiedades:</strong> prioridad, estado, tieneFecha, hora, tieneHora, tieneEtiquetas, tieneObjetivos, tieneSubtareas, esSubtarea, recurrente, repeticion, posposiciones.</p>
                            <p><strong>Valores útiles:</strong> hoy, ayer, mañana, viernes, “en 3 dias”, 15/08, &gt;3 y rangos entre fechas.</p>
                        </details>

                        <div class="advancedSearchDialogActions">

                            <button
                                type="submit"
                                class="primaryAction">
                                Aplicar
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

                            ${advancedSearchMode &&
                                searchQuery
                                ? `
                                    <button
                                        id="clearTaskSearch"
                                        type="button"
                                        class="tertiaryAction">
                                        Limpiar
                                    </button>
                                `
                                : ""}

                            <button
                                id="cancelAdvancedSearch"
                                type="button"
                                class="tertiaryAction">
                                Cancelar
                            </button>

                        </div>

                    </form>

                </dialog>

                    `
                    : ""}

                <nav>

                    <span class="sidebarSectionLabel">
                        Ejecución
                    </span>

                    <button
                        id="showInbox"
                        class="${buttonClass(View.INBOX)}">
                        <span>Inbox</span>
                        ${count("inbox")}
                    </button>

                    <button
                        id="showToday"
                        class="${buttonClass(View.TODAY)}">
                        <span>Hoy</span>
                        ${count("today")}
                    </button>

                    <button
                        id="showTomorrow"
                        class="${buttonClass(View.TOMORROW)}">
                        <span>Mañana</span>
                        ${count("tomorrow")}
                    </button>

                    <button
                        id="showUpcoming"
                        class="${buttonClass(View.UPCOMING)}">
                        <span>Próximas</span>
                        ${count("upcoming")}
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

                                        ${count(
                                            `area:${area.id}`
                                        )}

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
                                                    ${Icon.render(
                                                        "edit",
                                                        "sidebarUtilityIcon"
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    class="deleteCustomFilter"
                                                    data-id="${escapeHtml(filter.id)}"
                                                    aria-label="Eliminar ${escapeHtml(filter.name)}"
                                                    title="Eliminar filtro">
                                                    ${Icon.render(
                                                        "close",
                                                        "sidebarUtilityIcon"
                                                    )}
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

                    <div class="sidebarListControls">

                        ${taskViews.includes(activeView)
                            ? `
                                <button
                                    id="toggleBulkMode"
                                    type="button"
                                    class="taskToolsButton ${bulkSelectionMode
                                        ? "active"
                                        : ""}">
                                    ${bulkSelectionMode
                                        ? "Salir de selección"
                                        : "Selección múltiple"}
                                </button>
                            `
                            : ""}

                        ${filters || viewOptions
                            ? `
                            <button
                                id="openTaskTools"
                                type="button"
                                class="taskToolsButton ${Object.values(taskFilters).some(Boolean) ||
                                    taskSort !== "MANUAL"
                                    ? "active"
                                    : ""}">
                                Filtros rápidos
                            </button>

                            <dialog
                                id="taskToolsDialog"
                                class="taskToolsDialog"
                                aria-labelledby="taskToolsTitle"
                                data-requested-open="${taskToolsDialogOpen}">

                                <div class="taskToolsDialogHeader">

                                    <h2 id="taskToolsTitle">
                                        Filtros rápidos
                                    </h2>

                                    <button
                                        id="closeTaskTools"
                                        type="button"
                                        class="iconButton"
                                        aria-label="Cerrar filtros rápidos"
                                        title="Cerrar">
                                        ${Icon.render("close")}
                                    </button>

                                </div>

                                <div class="taskToolsDialogBody">
                                    ${filters}
                                    ${viewOptions}
                                </div>

                                <div class="taskToolsDialogFooter">
                                    <button
                                        id="cancelTaskTools"
                                        type="button"
                                        class="tertiaryAction">
                                        Cerrar
                                    </button>

                                    ${filters &&
                                        Object.values(taskFilters).some(Boolean)
                                        ? `
                                            <button
                                                id="clearTaskFilters"
                                                type="button"
                                                class="tertiaryAction">
                                                Limpiar
                                            </button>
                                        `
                                        : ""}

                                    ${filters
                                        ? `
                                            <button
                                                type="submit"
                                                form="taskFilterForm"
                                                class="primaryAction">
                                                Aplicar
                                            </button>
                                        `
                                        : ""}
                                </div>

                            </dialog>
                            `
                            : ""}

                        ${completedToggleViews.includes(activeView)
                            ? `
                                <button
                                    id="toggleCompletedTasks"
                                    type="button"
                                    class="taskToolsButton ${showCompletedTasks
                                        ? "active"
                                        : ""}">
                                    ${showCompletedTasks
                                        ? "Ocultar completadas"
                                        : "Mostrar completadas"}
                                </button>
                            `
                            : ""}

                    </div>

                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>

                    <button
                        id="showAll"
                        class="${buttonClass(View.ALL)}">
                        <span>Todas</span>
                        ${count("all")}
                    </button>

                    <button
                        id="showGoals"
                        class="${buttonClass(View.GOALS)}">
                        Objetivos
                    </button>

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

                </nav>

                <div class="sidebarSystemTools">

                    <button
                        id="openSettings"
                        type="button"
                        class="settingsButton ${settingsDialogOpen
                            ? "active"
                            : ""}"
                        aria-haspopup="dialog">
                        ${Icon.render("settings")}
                        <span>Configuración</span>
                    </button>

                    <dialog
                        id="settingsDialog"
                        class="settingsDialog"
                        aria-labelledby="settingsTitle"
                        data-requested-open="${settingsDialogOpen}">

                        <div class="settingsDialogHeader">

                            ${settingsSection
                                ? `
                                    <button
                                        id="backSettings"
                                        type="button"
                                        class="iconButton"
                                        aria-label="Volver a configuración"
                                        title="Volver">
                                        ${Icon.render("back")}
                                    </button>
                                `
                                : ""}

                            <h2 id="settingsTitle">
                                ${activeSettingsTitle}
                            </h2>

                            <button
                                id="closeSettings"
                                type="button"
                                class="iconButton"
                                aria-label="Cerrar configuración"
                                title="Cerrar">
                                ${Icon.render("close")}
                            </button>

                        </div>

                        <div class="settingsDialogBody">
                            ${activeSettingsContent}
                        </div>

                        <div class="settingsDialogFooter">
                            <button
                                id="cancelSettings"
                                type="button"
                                class="tertiaryAction">
                                Cerrar
                            </button>
                        </div>

                    </dialog>

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
