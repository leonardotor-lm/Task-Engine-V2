const MOBILE_MEDIA_QUERY =
    "(max-width: 760px)";

export class MobileTaskEditorLayoutController {

    constructor(app) {

        this.app = app;
        this.started = false;
        this.panelEvents = null;

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
                MOBILE_MEDIA_QUERY
            ).matches
        ) {
            return;
        }

        const drawer = document.querySelector(
            ".taskDrawer:not(.recoveryPanel)"
        );

        if (
            !drawer ||
            drawer.dataset.mobileTaskEditorLayout ===
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

        drawer.dataset.mobileTaskEditorLayout =
            "true";
        drawer.classList.add(
            "mobileTaskEditorLayout"
        );

        const recurrenceSection =
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

        this.prepareTextAndHints(
            primarySection
        );
        this.buildContextBar({
            primarySection,
            organizationSection
        });

        const layout = this.buildPrimaryContent({
            primarySection,
            organizationSection
        });

        this.buildToolGrid({
            anchor: layout.primarySurface,
            organizationSection,
            recurrenceSection,
            attachmentsSection,
            subtasksSection,
            tagsField: layout.tagsField,
            goalsField: layout.goalsField,
            moveField: layout.moveField
        });
        this.markRemainingSections({
            attachmentsSection,
            subtasksSection
        });
        this.groupActions(drawer);
        this.bindTransientPanels(drawer);

    }

    prepareTextAndHints(primarySection) {

        const hourLabel = document.querySelector(
            'label[for="taskDueTime"]'
        );

        if (hourLabel) {
            hourLabel.textContent = "Hora";
        }

        [
            "taskTitleEdit",
            "taskDescriptionEdit"
        ].forEach(id => {
            document.querySelector(
                `label[for="${id}"]`
            )?.classList.add(
                "mobileTaskEditorVisuallyHidden"
            );
        });

        document.querySelector(
            ".waitingTaskHint"
        )?.remove();

        primarySection.querySelectorAll(
            ":scope > summary"
        ).forEach(summary => summary.remove());

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
            "mobileTaskEditorContextBar";

        const areaField = this.extractField({
            container: organizationBody,
            controlId: "taskArea",
            className:
                "mobileTaskEditorContextField"
        });
        const contextField = this.extractField({
            container: organizationBody,
            controlId: "taskContext",
            className:
                "mobileTaskEditorContextField"
        });

        if (areaField) contextBar.append(areaField);
        if (contextField) contextBar.append(contextField);

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
                primarySurface: primarySection,
                tagsField: null,
                goalsField: null,
                moveField: null
            };
        }

        const primarySurface =
            document.createElement("section");
        primarySurface.className =
            "mobileTaskEditorPrimary";
        primarySurface.setAttribute(
            "aria-label",
            "Datos de la tarea"
        );

        const mainFields =
            document.createElement("div");
        mainFields.className =
            "mobileTaskEditorMainFields";

        const titleField = this.extractField({
            container: primaryBody,
            controlId: "taskTitleEdit",
            className:
                "mobileTaskEditorMainField mobileTaskEditorTitleField"
        });
        const descriptionField =
            this.extractField({
                container: primaryBody,
                controlId: "taskDescriptionEdit",
                className:
                    "mobileTaskEditorMainField mobileTaskEditorDescriptionField"
            });

        if (titleField) mainFields.append(titleField);
        if (descriptionField) mainFields.append(descriptionField);

        const properties =
            document.createElement("div");
        properties.className =
            "mobileTaskEditorProperties";
        properties.setAttribute(
            "aria-label",
            "Propiedades frecuentes"
        );

        [
            ["taskPriority", "Prioridad"],
            ["taskStartDate", "Inicio"],
            ["taskDueDate", "Fecha"],
            ["taskDueTime", "Hora"]
        ].forEach(([controlId, label]) => {

            const field = this.extractField({
                container: primaryBody,
                controlId,
                className:
                    "mobileTaskEditorProperty"
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
                "mobileTaskEditorWaitingProperty"
            );
            properties.append(waitingField);
        }

        const projectField =
            primaryBody.querySelector(
                ".projectTaskEditorField"
            );

        if (projectField) {
            projectField.classList.add(
                "mobileTaskEditorProjectProperty"
            );
            properties.append(projectField);
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
                "Etiquetas",
                { colorSelections: true }
            );
        }

        if (goalsField) {
            this.configurePicker(
                goalsField,
                "Objetivos"
            );
        }

        organizationBody
            .querySelectorAll(
                ".taskGoalPreserved"
            )
            .forEach(input => {
                goalsField?.append(input);
            });

        if (moveField) {
            this.configureMove(moveField);
        }

        primarySurface.append(
            mainFields,
            properties
        );
        primarySection.replaceWith(primarySurface);

        return {
            primarySurface,
            tagsField,
            goalsField,
            moveField
        };

    }

    configurePicker(
        fieldset,
        label,
        { colorSelections = false } = {}
    ) {

        fieldset.classList.add(
            "mobileTaskEditorTool",
            "mobileTaskEditorPicker"
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
                    "mobileTaskEditorPickerCount"
                );
                summary.append(count);
            }
        }

        if (body && chips) {
            chips.classList.add(
                "mobileTaskEditorPickerSelection"
            );
            body.prepend(chips);
        }

        if (details && body) {
            details.classList.add(
                "mobileTaskEditorTransient"
            );
            this.decoratePanel(
                details,
                body,
                label
            );
        }

        if (colorSelections && chips) {
            this.observeTagSelections(chips);
        }

    }

    configureMove(moveField) {

        moveField.classList.add(
            "mobileTaskEditorTool",
            "mobileTaskEditorMoveTool"
        );

        const details = moveField.querySelector(
            ".taskMoveManager"
        );
        const summary = details?.querySelector(
            ":scope > summary"
        );
        const body = details?.querySelector(
            ".taskMoveManagerBody"
        );

        if (summary) {
            summary.textContent = "Mover";
        }

        if (details && body) {
            details.classList.add(
                "mobileTaskEditorTransient"
            );
            this.decoratePanel(
                details,
                body,
                "Mover"
            );
        }

    }

    configureRecurrence(section) {

        section.classList.add(
            "mobileTaskEditorTool",
            "mobileTaskEditorRecurrenceTool",
            "mobileTaskEditorTransient"
        );
        section.open = false;

        const summary = section.querySelector(
            ":scope > summary"
        );
        const body = section.querySelector(
            ":scope > .editorSectionBody"
        );

        if (summary) {
            summary.textContent = "Recurrencia";
        }

        if (body) {
            this.decoratePanel(
                section,
                body,
                "Recurrencia"
            );
        }

    }

    decoratePanel(details, body, title) {

        body.classList.add(
            "mobileTaskEditorPanel"
        );

        const synchronizeVisibility = () => {
            body.hidden = !details.open;
        };

        details.addEventListener(
            "toggle",
            synchronizeVisibility
        );
        synchronizeVisibility();

        if (body.querySelector(
            ":scope > .mobileTaskEditorPanelHeader"
        )) {
            return;
        }

        const header =
            document.createElement("div");
        header.className =
            "mobileTaskEditorPanelHeader";

        const heading =
            document.createElement("strong");
        heading.textContent = title;

        const close =
            document.createElement("button");
        close.type = "button";
        close.className =
            "mobileTaskEditorPanelClose";
        close.setAttribute(
            "aria-label",
            `Cerrar ${title.toLowerCase()}`
        );
        close.textContent = "×";
        close.addEventListener(
            "click",
            () => {
                details.open = false;
                details.querySelector(
                    ":scope > summary"
                )?.focus();
            }
        );

        header.append(heading, close);
        body.prepend(header);

    }

    observeTagSelections(container) {

        const apply = () => {
            container.querySelectorAll(
                ".searchableMultiSelectChip"
            ).forEach(chip => {
                const color = chip.querySelector(
                    ".searchableMultiSelectColor"
                )?.style.background;

                chip.classList.add(
                    "mobileTaskEditorTagText"
                );

                if (color) {
                    chip.style.setProperty(
                        "--mobile-tag-color",
                        color
                    );
                }
            });
        };

        apply();

        new MutationObserver(apply).observe(
            container,
            {
                childList: true,
                subtree: true
            }
        );

    }

    buildToolGrid({
        anchor,
        organizationSection,
        recurrenceSection,
        attachmentsSection,
        subtasksSection,
        tagsField,
        goalsField,
        moveField
    }) {

        const grid = document.createElement("div");
        grid.className =
            "mobileTaskEditorToolGrid";
        grid.setAttribute(
            "aria-label",
            "Herramientas de la tarea"
        );

        if (tagsField) grid.append(tagsField);
        if (goalsField) grid.append(goalsField);

        if (recurrenceSection) {
            this.configureRecurrence(
                recurrenceSection
            );
            grid.append(recurrenceSection);
        }

        if (moveField) {
            grid.append(moveField);
        } else {
            const unavailableMove =
                document.createElement("button");
            unavailableMove.type = "button";
            unavailableMove.disabled = true;
            unavailableMove.className =
                "mobileTaskEditorToolButton";
            unavailableMove.textContent = "Mover";
            unavailableMove.title =
                "No hay destinos disponibles";
            grid.append(unavailableMove);
        }

        const reference =
            attachmentsSection ??
            subtasksSection;

        if (reference) {
            reference.before(grid);
        } else {
            anchor.after(grid);
        }

        organizationSection.remove();

    }

    markRemainingSections({
        attachmentsSection,
        subtasksSection
    }) {

        attachmentsSection?.classList.add(
            "mobileTaskEditorAttachments"
        );
        subtasksSection?.classList.add(
            "mobileTaskEditorSubtasks"
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
        const themedSelect = container.querySelector(
            `.mobileFilterSelect[data-for="${controlId}"]`
        );

        if (!control || !label) {
            return null;
        }

        const field =
            document.createElement("div");
        field.className = className;
        field.append(label, control);
        if (themedSelect) field.append(themedSelect);

        return field;

    }

    groupActions(drawer) {

        const actions = drawer.querySelector(
            "#saveTask"
        )?.closest(".taskEditorActions");

        if (!actions) return;

        actions.classList.add(
            "mobileTaskEditorFooter"
        );

        const mobileSaveButton =
            document.getElementById("saveTaskMobile");

        if (mobileSaveButton) {
            mobileSaveButton.hidden = true;
            mobileSaveButton.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        const administrativeActions =
            document.createElement("div");
        administrativeActions.className =
            "mobileTaskEditorAdministrativeActions";

        [
            "skipRecurringTask",
            "archiveTask",
            "deleteTask"
        ].forEach(id => {
            const button = document.getElementById(id);

            if (button && actions.contains(button)) {
                administrativeActions.append(button);
            }
        });

        const primaryActions =
            document.createElement("div");
        primaryActions.className =
            "mobileTaskEditorPrimaryActions";

        [
            "reopenTask",
            "toggleTask",
            "saveTask"
        ].forEach(id => {
            const button = document.getElementById(id);

            if (button && actions.contains(button)) {
                primaryActions.append(button);
            }
        });

        if (administrativeActions.childElementCount > 0) {
            actions.append(administrativeActions);
        }

        if (primaryActions.childElementCount > 0) {
            actions.append(primaryActions);
        }

        if (
            administrativeActions.childElementCount === 0 &&
            primaryActions.childElementCount === 0
        ) {
            actions.classList.add(
                "mobileTaskEditorFooterHidden"
            );
        }

    }

    bindTransientPanels(drawer) {

        if (this.panelEvents) {
            document.removeEventListener(
                "keydown",
                this.panelEvents.keydown
            );
            document.removeEventListener(
                "pointerdown",
                this.panelEvents.pointerdown
            );
        }

        const panels = () => Array.from(
            drawer.querySelectorAll(
                ".mobileTaskEditorTransient"
            )
        );

        const closeAll = except => {
            panels().forEach(panel => {
                if (panel !== except) {
                    panel.open = false;
                }
            });
        };

        panels().forEach(panel => {
            panel.addEventListener("toggle", () => {
                if (panel.open) {
                    closeAll(panel);
                }
            });
        });

        const keydown = event => {
            if (event.key !== "Escape") return;

            const openPanel = panels().find(
                panel => panel.open
            );

            if (!openPanel) return;

            event.preventDefault();
            event.stopPropagation();
            openPanel.open = false;
            openPanel.querySelector(
                ":scope > summary"
            )?.focus();
        };

        const pointerdown = event => {
            const openPanel = panels().find(
                panel => panel.open
            );

            if (
                !openPanel ||
                openPanel.contains(event.target)
            ) {
                return;
            }

            openPanel.open = false;
        };

        document.addEventListener(
            "keydown",
            keydown,
            true
        );
        document.addEventListener(
            "pointerdown",
            pointerdown,
            true
        );

        this.panelEvents = {
            keydown,
            pointerdown
        };

    }

}
