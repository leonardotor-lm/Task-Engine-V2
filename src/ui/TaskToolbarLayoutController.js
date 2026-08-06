import { Icon } from "./Icon.js";

const AREAS_LAYOUT_STORAGE_KEY =
    "task-engine-v2-sidebar-areas-expanded-v2";

export class TaskToolbarLayoutController {

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
            this.refineToolbar(state);
            this.restoreAreasSection();

        };

    }

    readAreasExpanded() {

        const value = this.storage?.getItem(
            AREAS_LAYOUT_STORAGE_KEY
        );

        return value === null || value === undefined
            ? true
            : value === "true";

    }

    writeAreasExpanded(expanded) {

        this.storage?.setItem(
            AREAS_LAYOUT_STORAGE_KEY,
            String(Boolean(expanded))
        );

    }

    refineToolbar(state) {

        const toolbar = document.getElementById(
            "taskContextToolbar"
        );
        const body = toolbar?.querySelector(
            ".taskContextToolbarBody"
        );

        if (!toolbar || !body) return;

        const filtersButton = document.getElementById(
            "openTaskTools"
        );
        const sortControl = body.querySelector(
            ".taskContextToolbarSort"
        );
        const waitingButton = document.getElementById(
            "toggleWaitingInArea"
        );
        const selectionButton = document.getElementById(
            "toggleBulkMode"
        );
        const metadataButton = document.getElementById(
            "toggleTaskMetadata"
        );
        const completedButton = document.getElementById(
            "toggleCompletedTasks"
        );

        if (filtersButton) {
            filtersButton.className =
                "taskContextToolbarButton taskContextToolbarTextButton";

            if (
                Object.values(
                    state.taskFilters ?? {}
                ).some(Boolean)
            ) {
                filtersButton.classList.add("active");
            }

            body.append(filtersButton);
        }

        if (sortControl) {
            body.append(sortControl);
        }

        if (waitingButton) {
            waitingButton.classList.add(
                "taskContextToolbarWaiting"
            );
            body.append(waitingButton);
        }

        const utilities = document.createElement("div");
        utilities.className =
            "taskContextToolbarUtilities";
        utilities.setAttribute(
            "aria-label",
            "Opciones de visualización"
        );

        if (selectionButton) {
            this.prepareIconButton(
                selectionButton,
                {
                    label: state.bulkSelectionMode
                        ? "Salir de selección múltiple"
                        : "Activar selección múltiple",
                    icon: this.renderListChecksIcon(),
                    pressed: Boolean(
                        state.bulkSelectionMode
                    )
                }
            );
            utilities.append(selectionButton);
        }

        if (metadataButton) {
            this.prepareIconButton(
                metadataButton,
                {
                    label: state.showTaskMetadata
                        ? "Ocultar detalles"
                        : "Mostrar detalles",
                    icon: Icon.render(
                        state.showTaskMetadata
                            ? "eye-off"
                            : "eye"
                    ),
                    pressed: Boolean(
                        state.showTaskMetadata
                    )
                }
            );
            utilities.append(metadataButton);
        }

        if (completedButton) {
            this.prepareIconButton(
                completedButton,
                {
                    label: state.showCompletedTasks
                        ? "Ocultar tareas completadas"
                        : "Mostrar tareas completadas",
                    icon: this.renderCompletedIcon(),
                    pressed: Boolean(
                        state.showCompletedTasks
                    )
                }
            );
            utilities.append(completedButton);
        }

        if (utilities.childElementCount > 0) {
            body.append(utilities);
        }

    }

    prepareIconButton(
        button,
        {
            label,
            icon,
            pressed
        }
    ) {

        button.className =
            "taskContextToolbarButton taskContextToolbarIconButton";
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.setAttribute(
            "aria-pressed",
            String(Boolean(pressed))
        );
        button.classList.toggle(
            "active",
            Boolean(pressed)
        );
        button.innerHTML = icon;

    }

    restoreAreasSection() {

        const areasSection = document.querySelector(
            ".sidebarAreaGroup"
        );

        if (!areasSection) return;

        areasSection.hidden = false;
        areasSection.classList.add(
            "sidebarAreaGroupVisible"
        );
        areasSection.open =
            this.readAreasExpanded();

        const summary =
            areasSection.querySelector("summary");

        const updateExpandedState = () => {
            summary?.setAttribute(
                "aria-expanded",
                String(areasSection.open)
            );
        };

        updateExpandedState();

        let ready = false;
        requestAnimationFrame(() => {
            ready = true;
        });

        areasSection.addEventListener(
            "toggle",
            () => {

                updateExpandedState();

                if (ready) {
                    this.writeAreasExpanded(
                        areasSection.open
                    );
                }

            }
        );

    }

    renderListChecksIcon() {

        return `
            <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                focusable="false">
                <path d="m3 6 2 2 4-4"></path>
                <path d="M11 6h10"></path>
                <path d="m3 12 2 2 4-4"></path>
                <path d="M11 12h10"></path>
                <path d="m3 18 2 2 4-4"></path>
                <path d="M11 18h10"></path>
            </svg>
        `;

    }

    renderCompletedIcon() {

        return `
            <svg
                class="icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                focusable="false">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="m8 12 3 3 5-6"></path>
            </svg>
        `;

    }

}
