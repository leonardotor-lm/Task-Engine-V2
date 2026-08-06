const DESKTOP_MEDIA_QUERY =
    "(min-width: 761px)";

export class DesktopTaskEditorLayoutController {

    constructor(app) {

        this.app = app;
        this.started = false;

    }

    start() {

        const view = this.app?.mainView;

        if (
            this.started ||
            !view ||
            typeof view.render !== "function"
        ) {
            return;
        }

        this.started = true;

        const originalRender =
            view.render.bind(view);

        view.render = state => {

            originalRender(state);
            this.enhanceEditor();

        };

    }

    enhanceEditor() {

        if (
            !window.matchMedia(
                DESKTOP_MEDIA_QUERY
            ).matches
        ) {
            return;
        }

        const drawer = document.querySelector(
            ".taskDrawer:not(.recoveryPanel)"
        );

        if (
            !drawer ||
            drawer.dataset.desktopTaskEditorLayout ===
                "true"
        ) {
            return;
        }

        const primarySection =
            document.getElementById(
                "taskTitleEdit"
            )?.closest(".editorSection");
        const organizationSection =
            document.getElementById(
                "taskArea"
            )?.closest(".editorSection");

        if (
            !primarySection ||
            !organizationSection
        ) {
            return;
        }

        drawer.dataset.desktopTaskEditorLayout =
            "true";
        drawer.classList.add(
            "desktopTaskEditorLayout"
        );

        this.markSections(drawer, {
            primarySection,
            organizationSection
        });
        this.buildContextBar({
            drawer,
            primarySection,
            organizationSection
        });
        this.buildPrimaryContent({
            primarySection,
            organizationSection
        });
        this.groupActions(drawer);

    }

    markSections(
        drawer,
        {
            primarySection,
            organizationSection
        }
    ) {

        primarySection.classList.add(
            "desktopTaskEditorPrimary"
        );
        primarySection.open = true;

        organizationSection.classList.add(
            "desktopTaskEditorOrganization"
        );

        const organizationSummary =
            organizationSection.querySelector(
                ":scope > summary"
            );

        if (organizationSummary) {
            organizationSummary.textContent =
                "Objetivos y organización";
        }

        document.getElementById(
            "taskRecurrence"
        )?.closest(".editorSection")
            ?.classList.add(
                "desktopTaskEditorPlanning"
            );

        drawer.querySelector(
            ".editorAttachmentsSection"
        )?.classList.add(
            "desktopTaskEditorAttachments"
        );

        drawer.querySelector(
            ".editorSubtasksSection"
        )?.classList.add(
            "desktopTaskEditorSubtasks"
        );

    }

    buildContextBar({
        primarySection,
        organizationSection
    }) {

        const organizationBody =
            organizationSection.querySelector(
                ".editorSectionBody"
            );

        if (!organizationBody) return;

        const contextBar =
            document.createElement("div");

        contextBar.className =
            "desktopTaskEditorContextBar";
        contextBar.setAttribute(
            "role",
            "group"
        );
        contextBar.setAttribute(
            "aria-label",
            "Área y contexto"
        );

        const areaField = this.extractField({
            container: organizationBody,
            controlId: "taskArea",
            className:
                "desktopTaskEditorContextField"
        });
        const contextField = this.extractField({
            container: organizationBody,
            controlId: "taskContext",
            className:
                "desktopTaskEditorContextField"
        });

        if (areaField) contextBar.append(areaField);
        if (contextField) {
            contextBar.append(contextField);
        }

        if (contextBar.childElementCount > 0) {
            primarySection.before(contextBar);
        }

    }

    buildPrimaryContent({
        primarySection,
        organizationSection
    }) {

        const primaryBody =
            primarySection.querySelector(
                ".editorSectionBody"
            );

        if (!primaryBody) return;

        const mainFields =
            document.createElement("div");
        mainFields.className =
            "desktopTaskEditorMainFields";

        const titleField = this.extractField({
            container: primaryBody,
            controlId: "taskTitleEdit",
            className:
                "desktopTaskEditorMainField desktopTaskEditorTitleField"
        });
        const descriptionField =
            this.extractField({
                container: primaryBody,
                controlId: "taskDescriptionEdit",
                className:
                    "desktopTaskEditorMainField desktopTaskEditorDescriptionField"
            });

        if (titleField) mainFields.append(titleField);
        if (descriptionField) {
            mainFields.append(descriptionField);
        }

        const properties =
            document.createElement("div");
        properties.className =
            "desktopTaskEditorProperties";
        properties.setAttribute(
            "aria-label",
            "Propiedades frecuentes"
        );

        [
            ["taskPriority", "Prioridad"],
            ["taskDueDate", "Fecha"],
            ["taskDueTime", "Hora"]
        ].forEach(([controlId, label]) => {

            const field = this.extractField({
                container: primaryBody,
                controlId,
                className:
                    "desktopTaskEditorProperty"
            });

            if (!field) return;

            field.dataset.propertyLabel = label;
            properties.append(field);

        });

        const waitingField =
            primaryBody.querySelector(
                ".waitingTaskEditorField"
            );

        if (waitingField) {
            waitingField.classList.add(
                "desktopTaskEditorWaitingProperty"
            );
            properties.append(waitingField);
        }

        const tagsField =
            organizationSection.querySelector(
                '[data-picker-id="taskTags"]'
            );

        if (tagsField) {
            tagsField.classList.add(
                "desktopTaskEditorTagsProperty"
            );
            properties.append(tagsField);
        }

        primaryBody.append(
            mainFields,
            properties
        );

    }

    extractField({
        container,
        controlId,
        className
    }) {

        const control = container.querySelector(
            `#${controlId}`
        );
        const label = container.querySelector(
            `label[for="${controlId}"]`
        );

        if (!control || !label) {
            return null;
        }

        const field =
            document.createElement("div");
        field.className = className;
        field.append(label, control);

        return field;

    }

    groupActions(drawer) {

        const actions = drawer.querySelector(
            ".taskEditorActions"
        );

        if (!actions) return;

        const primaryActions =
            document.createElement("div");
        primaryActions.className =
            "desktopTaskEditorPrimaryActions";

        [
            "toggleTask",
            "reopenTask",
            "saveTask"
        ].forEach(id => {
            const button =
                document.getElementById(id);

            if (button && actions.contains(button)) {
                primaryActions.append(button);
            }
        });

        const administrativeActions =
            document.createElement("div");
        administrativeActions.className =
            "desktopTaskEditorAdministrativeActions";

        [
            "skipRecurringTask",
            "archiveTask",
            "deleteTask"
        ].forEach(id => {
            const button =
                document.getElementById(id);

            if (button && actions.contains(button)) {
                administrativeActions.append(button);
            }
        });

        if (primaryActions.childElementCount > 0) {
            actions.append(primaryActions);
        }

        if (
            administrativeActions
                .childElementCount > 0
        ) {
            actions.append(administrativeActions);
        }

    }

}
