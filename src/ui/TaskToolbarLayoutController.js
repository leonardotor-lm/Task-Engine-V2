import { Icon } from "./Icon.js";

const SIDEBAR_GROUP_STORAGE_KEYS = Object.freeze({
    areas: "task-engine-v2-sidebar-areas-expanded-v3",
    planning: "task-engine-v2-sidebar-planning-expanded-v1",
    history: "task-engine-v2-sidebar-history-expanded-v1"
});

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
            this.configureSidebarGroups(state);

        };

    }

    readGroupExpanded(
        groupName,
        defaultValue
    ) {

        const key =
            SIDEBAR_GROUP_STORAGE_KEYS[groupName];

        if (!key) {
            throw new Error(
                `Grupo lateral desconocido: ${groupName}`
            );
        }

        const value = this.storage?.getItem(key);

        return value === null || value === undefined
            ? Boolean(defaultValue)
            : value === "true";

    }

    writeGroupExpanded(groupName, expanded) {

        const key =
            SIDEBAR_GROUP_STORAGE_KEYS[groupName];

        if (!key) {
            throw new Error(
                `Grupo lateral desconocido: ${groupName}`
            );
        }

        this.storage?.setItem(
            key,
            String(Boolean(expanded))
        );

    }

    readAreasExpanded() {

        return this.readGroupExpanded(
            "areas",
            true
        );

    }

    writeAreasExpanded(expanded) {

        this.writeGroupExpanded(
            "areas",
            expanded
        );

    }

    readPlanningExpanded() {

        return this.readGroupExpanded(
            "planning",
            true
        );

    }

    writePlanningExpanded(expanded) {

        this.writeGroupExpanded(
            "planning",
            expanded
        );

    }

    readHistoryExpanded(defaultValue = false) {

        return this.readGroupExpanded(
            "history",
            defaultValue
        );

    }

    writeHistoryExpanded(expanded) {

        this.writeGroupExpanded(
            "history",
            expanded
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

    configureSidebarGroups(state) {

        const navigation = document.querySelector(
            "#appSidebar nav"
        );

        if (!navigation) return;

        const areasGroup = navigation.querySelector(
            ".sidebarAreaGroup"
        );

        if (areasGroup) {
            areasGroup.hidden = false;
            areasGroup.classList.add(
                "sidebarAreaGroupVisible"
            );

            this.configurePersistentGroup(
                areasGroup,
                {
                    groupName: "areas",
                    label: "Áreas",
                    defaultExpanded: true
                }
            );
        }

        const planningGroup =
            this.ensurePlanningGroup(navigation);

        if (planningGroup) {
            this.configurePersistentGroup(
                planningGroup,
                {
                    groupName: "planning",
                    label: "Planificación",
                    defaultExpanded: true
                }
            );
        }

        const historyGroup =
            this.findHistoryGroup(navigation);

        if (historyGroup) {
            const historyViewActive = [
                "COMPLETED",
                "ARCHIVED",
                "TRASH"
            ].includes(state.view);

            this.configurePersistentGroup(
                historyGroup,
                {
                    groupName: "history",
                    label: "Historial",
                    defaultExpanded: historyViewActive
                }
            );
        }

    }

    ensurePlanningGroup(navigation) {

        const existing = navigation.querySelector(
            ".sidebarPlanningGroup"
        );

        if (existing) return existing;

        const planningLabel = Array.from(
            navigation.querySelectorAll(
                ":scope > .sidebarSectionLabel"
            )
        ).find(element =>
            element.textContent
                .trim()
                .toLocaleLowerCase("es") ===
            "planificación"
        );

        if (!planningLabel) return null;

        const buttons = [
            "showAll",
            "showCalendar",
            "showGoals"
        ].map(id =>
            document.getElementById(id)
        ).filter(Boolean);

        if (buttons.length === 0) return null;

        const group = document.createElement(
            "details"
        );
        group.className =
            "sidebarNavigationGroup sidebarUnifiedGroup sidebarPlanningGroup";

        const summary = document.createElement(
            "summary"
        );
        summary.textContent = "Planificación";

        const body = document.createElement("div");
        body.className =
            "sidebarNavigationGroupBody";

        for (const button of buttons) {
            body.append(button);
        }

        group.append(summary, body);
        planningLabel.replaceWith(group);

        return group;

    }

    findHistoryGroup(navigation) {

        const existing = navigation.querySelector(
            ".sidebarHistoryGroup"
        );

        if (existing) return existing;

        const group = Array.from(
            navigation.querySelectorAll(
                ":scope > details.sidebarNavigationGroup"
            )
        ).find(element =>
            element.querySelector(
                ":scope > summary"
            )?.textContent
                .trim()
                .toLocaleLowerCase("es") ===
            "historial"
        );

        if (!group) return null;

        group.classList.add(
            "sidebarHistoryGroup"
        );

        return group;

    }

    configurePersistentGroup(
        group,
        {
            groupName,
            label,
            defaultExpanded
        }
    ) {

        group.classList.add(
            "sidebarUnifiedGroup"
        );
        group.dataset.sidebarGroup = groupName;

        const summary = group.querySelector(
            ":scope > summary"
        );

        if (!summary) return;

        summary.textContent = label;
        summary.setAttribute(
            "aria-label",
            `${label}: mostrar u ocultar sección`
        );

        group.open = this.readGroupExpanded(
            groupName,
            defaultExpanded
        );

        const updateExpandedState = () => {
            summary.setAttribute(
                "aria-expanded",
                String(group.open)
            );
        };

        updateExpandedState();

        let ready = false;
        requestAnimationFrame(() => {
            ready = true;
        });

        group.addEventListener(
            "toggle",
            () => {

                updateExpandedState();

                if (ready) {
                    this.writeGroupExpanded(
                        groupName,
                        group.open
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
