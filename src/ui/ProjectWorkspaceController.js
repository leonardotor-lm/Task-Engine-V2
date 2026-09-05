import { View } from "../core/View.js";
import {
    ProjectPinPreferences
} from "../infrastructure/ProjectPinPreferences.js";

export class ProjectWorkspaceController {

    constructor(
        app,
        {
            documentRef = globalThis.document,
            pinPreferences = new ProjectPinPreferences()
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.pinPreferences = pinPreferences;
        this.projectExpansionSnapshot = null;
        this.lastRenderedView = null;

    }

    start() {

        const mainView = this.app.mainView;

        this.wrapProjectCallbacks(mainView);

        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            if (
                this.lastRenderedView === View.PROJECT &&
                state.view !== View.PROJECT
            ) {
                this.restoreProjectExpansionState();
            }

            this.lastRenderedView = state.view;

            let renderedState =
                state.view === View.PROJECT
                    ? {
                        ...state,
                        projectOriginView:
                            this.app.previousProjectView,
                        projectOriginCustomFilter:
                            this.getOriginCustomFilter()
                    }
                    : state;

            if (state.view === View.PROJECTS) {
                this.prunePinnedProjects();

                if (!this.isProjectsGroupingActive()) {
                    renderedState = {
                        ...renderedState,
                        tasks: this.orderPinnedProjectTrees(
                            renderedState.tasks ?? []
                        )
                    };
                }
            }

            originalRender(renderedState);
            this.bindProjectNavigation(renderedState);

            if (
                renderedState.view === View.PROJECTS ||
                renderedState.view === View.PROJECT
            ) {
                this.decorateProjectPins(renderedState);
                this.bindProjectPinActions();
            }

        };

    }

    wrapProjectCallbacks(mainView) {

        const callbacks = mainView.callbacks;

        if (!callbacks) return;

        const originalOpenProject =
            callbacks.onOpenProject;
        const originalSelectTask =
            callbacks.onSelectTask;

        if (originalOpenProject) {

            callbacks.onOpenProject = id => {

                const task = this.app.taskService
                    .getTaskById(id);

                if (
                    task &&
                    !task.isProject &&
                    this.app.taskService
                        .getProjectDescendants(id)
                        .length === 0
                ) {
                    return originalSelectTask?.(id);
                }

                if (
                    this.app.currentView !==
                        View.PROJECT
                ) {
                    this.captureProjectExpansionState();
                    this.app.projectOriginCustomFilterId =
                        this.app.currentCustomFilterId ??
                        null;
                }

                return originalOpenProject(id);

            };

        }

        const originalCloseProject =
            callbacks.onCloseProject;

        if (originalCloseProject) {

            callbacks.onCloseProject = () => {

                if (
                    this.app.currentView ===
                        View.PROJECT &&
                    this.app.projectHistory.length === 0 &&
                    this.restoreCustomFilterOrigin()
                ) {
                    return;
                }

                return originalCloseProject();

            };

        }

    }

    prunePinnedProjects() {

        const getActiveProjectRoots =
            this.app.taskService
                ?.getActiveProjectRoots;

        if (typeof getActiveProjectRoots !== "function") {
            return;
        }

        const validProjectIds =
            getActiveProjectRoots
                .call(this.app.taskService)
                .map(project => project.id);

        this.pinPreferences.prune(
            validProjectIds
        );

    }

    isProjectsGroupingActive() {

        const repository =
            this.app.taskGroupingPreferencesRepository;

        if (!repository?.get) return false;

        return repository.get(
            `view:${View.PROJECTS}`
        ) !== "NONE";

    }

    orderPinnedProjectTrees(tasks) {

        const taskById = new Map(
            tasks.map(task => [task.id, task])
        );
        const roots = tasks.filter(task =>
            !task.parentTaskId ||
            !taskById.has(task.parentTaskId)
        );
        const rootIds = new Set(
            roots.map(task => task.id)
        );
        const pinnedRoots = roots.filter(task =>
            this.pinPreferences.isPinned(task.id)
        );
        const regularRoots = roots.filter(task =>
            !this.pinPreferences.isPinned(task.id)
        );

        return [
            ...pinnedRoots,
            ...regularRoots,
            ...tasks.filter(task =>
                !rootIds.has(task.id)
            )
        ];

    }

    decorateProjectPins(state) {

        if (state.view === View.PROJECTS) {
            this.decorateProjectsList(state);
        }

        if (state.view === View.PROJECT) {
            this.decorateProjectWorkspace(state);
        }

    }

    decorateProjectsList(state) {

        const taskList = this.document
            ?.querySelector?.(
                ".content .taskList"
            );

        if (!taskList) return;

        const groupingActive =
            this.isProjectsGroupingActive();
        const tasks = state.tasks ?? [];
        const taskById = new Map(
            tasks.map(task => [task.id, task])
        );
        const roots = tasks.filter(task =>
            !task.parentTaskId ||
            !taskById.has(task.parentTaskId)
        );
        const rootIds = new Set(
            roots.map(task => task.id)
        );
        const rows = Array.from(
            taskList.querySelectorAll(
                ":scope > li.task"
            )
        );
        const rowsById = new Map(
            rows.map(row => [
                row.dataset.id,
                row
            ])
        );
        const pinnedRoots = roots.filter(task =>
            this.pinPreferences.isPinned(task.id)
        );
        const regularRoots = roots.filter(task =>
            !this.pinPreferences.isPinned(task.id)
        );

        for (const project of roots) {

            const row = rowsById.get(project.id);

            if (!row) continue;

            const pinned =
                this.pinPreferences.isPinned(
                    project.id
                );

            if (pinned) {
                const title = row.querySelector(
                    ".taskTitle"
                );

                if (title) {
                    const indicator =
                        this.document.createElement(
                            "span"
                        );
                    indicator.className =
                        "projectPinnedIndicator";
                    indicator.title =
                        "Proyecto anclado";
                    indicator.setAttribute(
                        "aria-label",
                        "Proyecto anclado"
                    );
                    indicator.style.cssText = [
                        "display:inline-flex",
                        "align-items:center",
                        "margin-right:0.35rem",
                        "vertical-align:middle"
                    ].join(";");
                    indicator.innerHTML =
                        this.renderPinIcon(
                            "projectPinnedIcon"
                        );
                    title.prepend(indicator);
                }
            }

            const menu = row.querySelector(
                ".quickMoreMenu"
            );

            if (menu) {
                const action =
                    this.createPinActionButton(
                        project,
                        pinned
                    );
                const menuHeader =
                    menu.querySelector(
                        ".quickActionsSheetHeader"
                    );

                if (menuHeader) {
                    menuHeader.insertAdjacentElement(
                        "afterend",
                        action
                    );
                } else {
                    menu.prepend(action);
                }
            }

        }

        if (
            groupingActive ||
            pinnedRoots.length === 0
        ) {
            return;
        }

        const firstPinnedRow = rowsById.get(
            pinnedRoots[0].id
        );

        if (firstPinnedRow) {
            taskList.insertBefore(
                this.createPinSectionHeader(
                    "Anclados",
                    true
                ),
                firstPinnedRow
            );
        }

        if (regularRoots.length > 0) {
            const firstRegularRow = rowsById.get(
                regularRoots[0].id
            );

            if (firstRegularRow) {
                taskList.insertBefore(
                    this.createPinSectionHeader(
                        "Otros proyectos"
                    ),
                    firstRegularRow
                );
            }
        }

        for (const row of rows) {
            const task = taskById.get(
                row.dataset.id
            );

            if (
                task &&
                !rootIds.has(task.id)
            ) {
                row.classList.add(
                    "projectPinDescendant"
                );
            }
        }

    }

    decorateProjectWorkspace(state) {

        const project = state.projectTask;

        if (!this.isPinEligible(project)) {
            return;
        }

        const actions = this.document
            ?.querySelector?.(
                ".projectWorkspace .taskListHeadingActions"
            );

        if (!actions) return;

        const pinned =
            this.pinPreferences.isPinned(
                project.id
            );
        const button =
            this.createPinActionButton(
                project,
                pinned,
                true
            );

        actions.prepend(button);

    }

    createPinActionButton(
        project,
        pinned,
        headingAction = false
    ) {

        const button =
            this.document.createElement(
                "button"
            );
        const label = pinned
            ? "Desanclar proyecto"
            : "Anclar proyecto";

        button.type = "button";
        button.className = headingAction
            ? "quickToggleProjectPin secondaryAction projectHeadingAction responsiveIconButton"
            : "quickToggleProjectPin";
        button.dataset.id = project.id;
        button.title = label;
        button.setAttribute(
            "aria-label",
            label
        );

        if (headingAction) {
            const icon =
                this.document.createElement(
                    "span"
                );
            icon.className =
                "responsiveButtonIcon";
            icon.innerHTML =
                this.renderPinIcon(
                    "projectPinActionIcon"
                );

            const text =
                this.document.createElement(
                    "span"
                );
            text.className =
                "responsiveButtonLabel";
            text.textContent = label;

            button.append(icon, text);
        } else {
            button.textContent = label;
        }

        return button;

    }

    renderPinIcon(className = "") {

        const classes = [
            "icon",
            className
        ].filter(Boolean).join(" ");

        return `
            <svg
                class="${classes}"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                focusable="false">
                <path d="M12 17v5"></path>
                <path d="M5 17h14"></path>
                <path d="M6 3h12l-2 7 3 3H5l3-3z"></path>
            </svg>
        `;

    }

    createPinSectionHeader(
        label,
        pinned = false
    ) {

        const header =
            this.document.createElement("li");
        const title =
            this.document.createElement("strong");

        header.className =
            "projectPinSectionHeader";
        header.style.cssText = [
            "list-style:none",
            "padding:0.75rem 0.35rem 0.35rem",
            "font-size:0.86rem",
            "font-weight:700",
            "letter-spacing:0.01em"
        ].join(";");

        if (pinned) {
            title.style.cssText = [
                "display:inline-flex",
                "align-items:center",
                "gap:0.4rem"
            ].join(";");
            title.innerHTML =
                `${this.renderPinIcon(
                    "projectPinSectionIcon"
                )}<span></span>`;
            title.querySelector("span")
                .textContent = label;
        } else {
            title.textContent = label;
        }

        header.append(title);

        return header;

    }

    bindProjectPinActions() {

        this.document
            ?.querySelectorAll?.(
                ".quickToggleProjectPin"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.toggleProjectPin(
                            button.dataset.id
                        );
                    }
                );

            });

    }

    toggleProjectPin(projectId) {

        const project = this.app.taskService
            .getTaskById(projectId);

        if (!this.isPinEligible(project)) {
            this.pinPreferences.setPinned(
                projectId,
                false
            );
            return false;
        }

        const pinned =
            this.pinPreferences.toggle(
                project.id
            );

        this.app.render();

        return pinned;

    }

    isPinEligible(project) {

        return Boolean(
            project &&
            project.isProject &&
            !project.parentTaskId &&
            !project.isCompleted?.() &&
            !project.isArchived?.() &&
            !project.isDeleted?.()
        );

    }

    bindProjectNavigation(state) {

        if (state.view !== View.PROJECT) {
            return;
        }

        this.document
            ?.querySelectorAll?.(
                ".projectBreadcrumbProject"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        this.navigateToProject(
                            button.dataset.id
                        );
                    }
                );

            });

        this.document
            ?.getElementById?.(
                "projectBreadcrumbRoot"
            )
            ?.addEventListener(
                "click",
                () => this.returnToOrigin()
            );

    }

    navigateToProject(projectId) {

        if (!projectId) return;

        const project = this.app.taskService
            .getTaskById(projectId);

        if (!project) return;

        this.app.projectTaskId = project.id;
        this.app.projectHistory =
            this.getAncestorIds(project);
        this.app.projectTaskCreationOpen = false;
        this.app.inlineSubtaskParentId = null;
        this.app.selectedTask = null;
        this.app.currentView = View.PROJECT;

        this.app.expandedTaskIds.add(project.id);

        for (
            const descendant of
            this.app.taskService
                .getProjectDescendants(project.id)
        ) {
            this.app.expandedTaskIds.add(
                descendant.id
            );
        }

        this.app.render();

    }

    returnToOrigin() {

        if (this.restoreCustomFilterOrigin()) {
            return;
        }

        this.app.projectOriginCustomFilterId = null;
        this.app.currentView =
            this.app.previousProjectView ??
            View.TODAY;
        this.clearProjectState();
        this.app.render();

    }

    restoreCustomFilterOrigin() {

        const filter = this.getOriginCustomFilter();

        if (!filter) {
            this.app.projectOriginCustomFilterId = null;
            return false;
        }

        const applyCustomFilter =
            this.app.mainView
                ?.callbacks
                ?.onApplyCustomFilter;

        if (!applyCustomFilter) {
            return false;
        }

        const filterId = filter.id;

        this.app.projectOriginCustomFilterId = null;
        this.clearProjectState();
        applyCustomFilter(filterId);

        return true;

    }

    getOriginCustomFilter() {

        const filterId =
            this.app.projectOriginCustomFilterId;

        if (!filterId) return null;

        return this.app.customFilterService
            ?.getFilterById?.(filterId) ??
            null;

    }

    clearProjectState() {

        this.app.projectTaskId = null;
        this.app.projectHistory = [];
        this.app.projectTaskCreationOpen = false;
        this.app.inlineSubtaskParentId = null;
        this.app.selectedTask = null;

    }

    captureProjectExpansionState() {

        this.projectExpansionSnapshot = new Set(
            this.app.expandedTaskIds ?? []
        );

    }

    restoreProjectExpansionState() {

        if (!this.projectExpansionSnapshot) return;

        const expandedTaskIds =
            this.app.expandedTaskIds;

        if (expandedTaskIds?.clear && expandedTaskIds?.add) {
            expandedTaskIds.clear();

            for (
                const id of
                this.projectExpansionSnapshot
            ) {
                expandedTaskIds.add(id);
            }
        }

        this.projectExpansionSnapshot = null;

    }

    getAncestorIds(project) {

        const ancestors = [];
        const visited = new Set([project.id]);
        let parentId = project.parentTaskId;

        while (parentId && !visited.has(parentId)) {

            const parent = this.app.taskService
                .getTaskById(parentId);

            if (!parent) break;

            ancestors.unshift(parent.id);
            visited.add(parent.id);
            parentId = parent.parentTaskId;

        }

        return ancestors;

    }

}
