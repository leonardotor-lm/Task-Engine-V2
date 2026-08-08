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
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            const renderedState =
                state.view === View.PROJECT
                    ? {
                        ...state,
                        projectOriginView:
                            this.app.previousProjectView
                    }
                    : state;

            originalRender(renderedState);
            this.bindProjectNavigation(renderedState);

        };

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

        this.app.currentView =
            this.app.previousProjectView ??
            View.TODAY;
        this.app.projectTaskId = null;
        this.app.projectHistory = [];
        this.app.projectTaskCreationOpen = false;
        this.app.inlineSubtaskParentId = null;
        this.app.selectedTask = null;
        this.app.render();

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
