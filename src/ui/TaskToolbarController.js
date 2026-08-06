import { Icon } from "./Icon.js";

const MOBILE_TOOLBAR_STORAGE_KEY =
    "task-engine-v2-mobile-task-toolbar-expanded";

const AREAS_EXPANDED_STORAGE_KEY =
    "task-engine-v2-sidebar-areas-expanded";

export class TaskToolbarController {

    constructor(
        app,
        {
            storage = globalThis.localStorage
        } = {}
    ) {

        this.app = app;
        this.storage = storage;

    }

    start() {

        const mainView = this.app.mainView;
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);

            this.buildTaskToolbar(state);
            this.configureAreasSection();

        };

    }

    readBooleanPreference(
        key,
        defaultValue
    ) {

        const value = this.storage?.getItem(key);

        if (value === null || value === undefined) {
            return defaultValue;
        }

        return value === "true";

    }

    writeBooleanPreference(key, value) {

        this.storage?.setItem(
            key,
            String(Boolean(value))
        );

    }

    isMobileToolbarExpanded() {

        return this.readBooleanPreference(
            MOBILE_TOOLBAR_STORAGE_KEY,
            true
        );

    }

    setMobileToolbarExpanded(expanded) {

        this.writeBooleanPreference(
            MOBILE_TOOLBAR_STORAGE_KEY,
            expanded
        );

    }

    isAreasSectionExpanded() {

        return this.readBooleanPreference(
            AREAS_EXPANDED_STORAGE_KEY,
            true
        );

    }

    setAreasSectionExpanded(expanded) {

        this.writeBooleanPreference(
            AREAS_EXPANDED_STORAGE_KEY,
            expanded
        );

    }

    buildTaskToolbar(state) {

        const content = document.querySelector(
            ".content"
        );
        const heading = content?.querySelector(
            ".taskListHeading"
        );

        if (!content || !heading) return;

        const bulkButton = document.getElementById(
            "toggleBulkMode"
        );
        const filtersButton = document.getElementById(
            "openTaskTools"
        );
        const completedButton = document.getElementById(
            "toggleCompletedTasks"
        );
        const areaWaitingButton =
            document.getElementById(
                "toggleWaitingInArea"
            );
        const taskToolsDialog =
            document.getElementById(
                "taskToolsDialog"
            );
        const filterSection = taskToolsDialog
            ?.querySelector(".taskFilters");
        const sortSelect = taskToolsDialog
            ?.querySelector("#taskSort");

        if (
            !bulkButton &&
            !filtersButton &&
            !completedButton &&
            !areaWaitingButton &&
            !sortSelect
        ) {
            return;
        }

        const toolbar = document.createElement(
            "details"
        );

        toolbar.id = "taskContextToolbar";
        toolbar.className = "taskContextToolbar";
        toolbar.open = Boolean(
            state.bulkSelectionMode ||
            this.isMobileToolbarExpanded()
        );

        toolbar.innerHTML = `
            <summary
                class="taskContextToolbarSummary"
                aria-label="Mostrar u ocultar herramientas de la lista">
                <span>Herramientas de la lista</span>
                ${Icon.render("chevron-down")}
            </summary>

            <div
                class="taskContextToolbarBody"
                role="toolbar"
                aria-label="Herramientas de la lista de tareas">
            </div>
        `;

        heading.insertAdjacentElement(
            "afterend",
            toolbar
        );

        const body = toolbar.querySelector(
            ".taskContextToolbarBody"
        );

        if (bulkButton) {

            const active = Boolean(
                state.bulkSelectionMode
            );
            const label = active
                ? "Salir de selección múltiple"
                : "Activar selección múltiple";

            this.prepareToolbarButton(
                bulkButton,
                {
                    label,
                    shortLabel: "Selección",
                    icon: "check",
                    pressed: active
                }
            );

            body.append(bulkButton);

        }

        if (filtersButton && filterSection) {

            const filtersActive =
                Object.values(
                    state.taskFilters ?? {}
                ).some(Boolean);

            this.prepareToolbarButton(
                filtersButton,
                {
                    label: "Abrir filtros",
                    shortLabel: "Filtros",
                    pressed: filtersActive,
                    textOnly: true
                }
            );

            body.append(filtersButton);

        } else {
            filtersButton?.remove();
        }

        if (sortSelect) {

            const sortControl =
                document.createElement("label");

            sortControl.className =
                "taskContextToolbarSort";
            sortControl.setAttribute(
                "for",
                "taskSort"
            );
            sortControl.innerHTML = `
                <span>Orden</span>
            `;
            sortControl.append(sortSelect);
            body.append(sortControl);

        }

        if (completedButton) {

            const active = Boolean(
                state.showCompletedTasks
            );
            const label = active
                ? "Ocultar tareas completadas"
                : "Mostrar tareas completadas";

            this.prepareToolbarButton(
                completedButton,
                {
                    label,
                    shortLabel: "Completadas",
                    icon: active
                        ? "eye-off"
                        : "eye",
                    pressed: active
                }
            );

            body.append(completedButton);

        }

        if (areaWaitingButton) {

            areaWaitingButton.classList.remove(
                "taskToolsButton"
            );
            areaWaitingButton.classList.add(
                "taskContextToolbarButton"
            );

            body.append(areaWaitingButton);

        }

        this.prepareFiltersDialog({
            toolbar,
            taskToolsDialog,
            filterSection
        });

        toolbar.addEventListener(
            "toggle",
            () => {

                if (state.bulkSelectionMode) {
                    toolbar.open = true;
                    return;
                }

                this.setMobileToolbarExpanded(
                    toolbar.open
                );

            }
        );

        document.querySelector(
            ".sidebarListControls:empty"
        )?.remove();

    }

    prepareToolbarButton(
        button,
        {
            label,
            shortLabel,
            icon = null,
            pressed = null,
            textOnly = false
        }
    ) {

        button.classList.remove(
            "taskToolsButton"
        );
        button.classList.add(
            "taskContextToolbarButton"
        );

        button.setAttribute(
            "aria-label",
            label
        );
        button.setAttribute("title", label);

        if (pressed !== null) {
            button.setAttribute(
                "aria-pressed",
                String(Boolean(pressed))
            );
            button.classList.toggle(
                "active",
                Boolean(pressed)
            );
        }

        button.innerHTML = textOnly
            ? `<span>${shortLabel}</span>`
            : `
                <span class="taskContextToolbarIcon">
                    ${Icon.render(icon)}
                </span>
                <span class="taskContextToolbarLabel">
                    ${shortLabel}
                </span>
            `;

    }

    prepareFiltersDialog({
        toolbar,
        taskToolsDialog,
        filterSection
    }) {

        if (!taskToolsDialog) return;

        taskToolsDialog
            .querySelector(".taskViewOptions")
            ?.remove();

        if (!filterSection) {
            taskToolsDialog.remove();
            return;
        }

        const title = taskToolsDialog
            .querySelector("#taskToolsTitle");

        if (title) {
            title.textContent = "Filtros";
        }

        taskToolsDialog
            .querySelector("#closeTaskTools")
            ?.setAttribute(
                "aria-label",
                "Cerrar filtros"
            );

        taskToolsDialog.classList.add(
            "taskFiltersDialog"
        );

        toolbar.insertAdjacentElement(
            "afterend",
            taskToolsDialog
        );

    }

    configureAreasSection() {

        const areasSection = document.querySelector(
            ".sidebarAreaGroup"
        );

        if (!areasSection) return;

        areasSection.open =
            this.isAreasSectionExpanded();

        const summary =
            areasSection.querySelector("summary");

        const updateExpandedState = () => {

            summary?.setAttribute(
                "aria-expanded",
                String(areasSection.open)
            );

        };

        updateExpandedState();

        areasSection.addEventListener(
            "toggle",
            () => {

                this.setAreasSectionExpanded(
                    areasSection.open
                );
                updateExpandedState();

            }
        );

    }

}
