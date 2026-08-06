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

        const planningSection =
            document.getElementById(
                "taskRecurrence"
            )?.closest(".editorSection") ?? null;
        const attachmentsSection =
            drawer.querySelector(
                ".editorAttachmentsSection"
            );
        const subtasksSection =
            drawer.querySelector(
                ".editorSubtasksSection"
            );

        this.prepareTextAndHints();
        this.buildContextBar({
            primarySection,
            organizationSection
        });

        const tools = this.buildPrimaryContent({
            primarySection,
            organizationSection
        });

        this.buildMoreTools({
            primarySection,
            organizationSection,
            planningSection,
            attachmentsSection,
            subtasksSection,
            goalsField: tools.goalsField
        });
        this.groupActions(
            drawer,
            tools.moveField
        );
        this.markRemainingSections({
            attachmentsSection,
            subtasksSection
        });

    }

    prepareTextAndHints() {

        const hourLabel = document.querySelector(
            'label[for="taskDueTime"]'
        );

        if (hourLabel) {
            hourLabel.textContent = "Hora";
        }

        const titleLabel = document.querySelector(
            'label[for="taskTitleEdit"]'
        );

        titleLabel?.classList.add(
            "desktopTaskEditorVisuallyHidden"
        );

        const descriptionLabel = document.querySelector(
            'label[for="taskDescriptionEdit"]'
        );

        descriptionLabel?.classList.add(
            "desktopTaskEditorVisuallyHidden"
        );

        document.querySelector(
            ".waitingTaskHint"
        )?.remove();

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
        const organizationBody =
            organizationSection.querySelector(
                ".editorSectionBody"
            );

        if (!primaryBody || !organizationBody) {
            return {
                goalsField: null,
                moveField: null
            };
        }

        primarySection.classList.add(
            "desktopTaskEditorPrimary"
        );
        primarySection.open = true;

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
            organizationBody.querySelector(
                '[data-picker-id="taskTags"]'
            );
        const goalsField =
            organizationBody.querySelector(
                '[data-picker-id="taskGoals"]'
            );
        const moveField =
            organizationBody.querySelector(
                ".taskMoveField"
            );

        if (tagsField) {
            this.configurePicker(
                tagsField,
                "Etiquetas"
            );
            tagsField.classList.add(
                "desktopTaskEditorTagsProperty"
            );
            properties.append(tagsField);
        }

        if (goalsField) {
            this.configurePicker(
                goalsField,
                "Objetivos"
            );
            goalsField.classList.add(
                "desktopTaskEditorGoalsTool"
            );
        }

        organizationBody
            .querySelectorAll(
                ".taskGoalPreserved"
            )
            .forEach(input => {
                if (goalsField) {
                    goalsField.append(input);
                }
            });

        if (moveField) {
            moveField.classList.add(
                "desktopTaskEditorMoveTool"
            );
            const summary = moveField.querySelector(
                ".taskMoveManager > summary"
            );
            if (summary) {
                summary.textContent = "Mover";
            }
        }

        primaryBody.append(
            mainFields,
            properties
        );

        return {
            goalsField,
            moveField
        };

    }

    configurePicker(fieldset, label) {

        fieldset.classList.add(
            "desktopTaskEditorPicker"
        );

        const details = fieldset.querySelector(
            ".searchableMultiSelectManager"
        );
        const summary = details?.querySelector(
            ":scope > summary"
        );
        const body = details?.querySelector(
            ".searchableMultiSelectManagerBody"
        );
        const chips = fieldset.querySelector(
            ".searchableMultiSelectChips"
        );
        const count = fieldset.querySelector(
            ".searchableMultiSelectHeader strong"
        );

        fieldset.querySelector(
            ".searchableMultiSelectHeader"
        )?.remove();

        if (summary) {
            summary.replaceChildren(
                document.createTextNode(label)
            );

            if (count) {
                count.classList.add(
                    "desktopTaskEditorPickerCount"
                );
                summary.append(count);
            }
        }

        if (body && chips) {
            chips.classList.add(
                "desktopTaskEditorPickerSelection"
            );
            body.prepend(chips);
        }

    }

    buildMoreTools({
        primarySection,
        organizationSection,
        planningSection,
        attachmentsSection,
        subtasksSection,
        goalsField
    }) {

        const moreTools =
            document.createElement("details");
        moreTools.className =
            "desktopTaskEditorMoreTools";

        const summary =
            document.createElement("summary");
        summary.textContent = "Más herramientas";

        const panel =
            document.createElement("div");
        panel.className =
            "desktopTaskEditorMoreToolsPanel";

        if (goalsField) {
            panel.append(goalsField);
        }

        if (planningSection) {
            planningSection.classList.add(
                "desktopTaskEditorPlanningTool"
            );
            panel.append(planningSection);
        }

        if (panel.childElementCount > 0) {
            moreTools.append(summary, panel);

            const reference =
                attachmentsSection ??
                subtasksSection;

            if (reference) {
                reference.before(moreTools);
            } else {
                primarySection.after(moreTools);
            }
        }

        organizationSection.remove();

    }

    markRemainingSections({
        attachmentsSection,
        subtasksSection
    }) {

        attachmentsSection?.classList.add(
            "desktopTaskEditorAttachments"
        );
        subtasksSection?.classList.add(
            "desktopTaskEditorSubtasks"
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

    groupActions(drawer, moveField) {

        const actions = drawer.querySelector(
            ".taskEditorActions"
        );

        if (!actions) return;

        actions.classList.add(
            "desktopTaskEditorFooter"
        );

        const utilityActions =
            document.createElement("div");
        utilityActions.className =
            "desktopTaskEditorUtilityActions";

        if (moveField) {
            utilityActions.append(moveField);
        }

        [
            "skipRecurringTask",
            "archiveTask",
            "deleteTask"
        ].forEach(id => {
            const button =
                document.getElementById(id);

            if (button && actions.contains(button)) {
                utilityActions.append(button);
            }
        });

        const primaryActions =
            document.createElement("div");
        primaryActions.className =
            "desktopTaskEditorPrimaryActions";

        [
            "reopenTask",
            "toggleTask",
            "saveTask"
        ].forEach(id => {
            const button =
                document.getElementById(id);

            if (button && actions.contains(button)) {
                primaryActions.append(button);
            }
        });

        if (utilityActions.childElementCount > 0) {
            actions.append(utilityActions);
        }

        if (primaryActions.childElementCount > 0) {
            actions.append(primaryActions);
        }

    }

}
