import { View } from "../core/View.js";

export class ProjectWorkspaceController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;

    }

    start() {

        const mainView = this.app.mainView;

        this.wrapProjectCallbacks(mainView);

        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            const renderedState =
                state.view === View.PROJECT
                    ? {
                        ...state,
                        projectOriginView:
                            this.app.previousProjectView,
                        projectOriginCustomFilter:
                            this.getOriginCustomFilter()
                    }
                    : state;

            originalRender(renderedState);
            this.bindProjectNavigation(renderedState);

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
