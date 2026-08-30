import {
    TaskToolbarController
} from "./TaskToolbarController.js";

const MOBILE_TOOLBAR_STORAGE_KEY =
    "task-engine-v2-mobile-task-toolbar-expanded-v2";

const MOBILE_LAYOUT_MEDIA =
    "(max-width: 760px)";

const MOBILE_ICONS = Object.freeze({
    filter: `
        <path d="M4 5h16"></path>
        <path d="M7 12h10"></path>
        <path d="M10 19h4"></path>
    `,
    sort: `
        <path d="m8 7 4-4 4 4"></path>
        <path d="M12 3v18"></path>
        <path d="m16 17-4 4-4-4"></path>
    `,
    group: `
        <rect x="3" y="4" width="8" height="6" rx="1"></rect>
        <rect x="13" y="4" width="8" height="6" rx="1"></rect>
        <rect x="3" y="14" width="8" height="6" rx="1"></rect>
        <rect x="13" y="14" width="8" height="6" rx="1"></rect>
    `,
    more: `
        <circle cx="5" cy="12" r="1"></circle>
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
    `,
    chevronDown: `
        <path d="m7 10 5 5 5-5"></path>
    `,
    chevronUp: `
        <path d="m7 14 5-5 5 5"></path>
    `
});

function renderMobileIcon(name) {

    return `
        <svg
            class="icon mobileTaskToolbarIcon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            focusable="false">
            ${MOBILE_ICONS[name]}
        </svg>
    `;

}

export class CompactTaskToolbarController
    extends TaskToolbarController {

    constructor(
        app,
        {
            storage = globalThis.localStorage,
            windowRef = globalThis.window,
            documentRef = globalThis.document
        } = {}
    ) {

        super(app, { storage });
        this.window = windowRef;
        this.document = documentRef;
        this.toolbarObserver = null;
        this.toolbarControlsChanged = () => {
            if (!this.isMobileViewport()) return;
            this.decorateToolbarSelects();
        };

    }

    start() {

        super.start();
        this.document?.addEventListener?.(
            "task-toolbar-controls-changed",
            this.toolbarControlsChanged
        );

    }

    isMobileViewport() {

        return Boolean(
            this.window?.matchMedia?.(
                MOBILE_LAYOUT_MEDIA
            )?.matches
        );

    }

    isMobileToolbarExpanded() {

        return this.readBooleanPreference(
            MOBILE_TOOLBAR_STORAGE_KEY,
            false
        );

    }

    setMobileToolbarExpanded(expanded) {

        if (!this.isMobileViewport()) {
            return;
        }

        this.writeBooleanPreference(
            MOBILE_TOOLBAR_STORAGE_KEY,
            expanded
        );

    }

    shouldExpandToolbar(state = {}) {

        if (!this.isMobileViewport()) {
            return true;
        }

        return Boolean(
            state.bulkSelectionMode ||
            this.isMobileToolbarExpanded()
        );

    }

    buildTaskToolbar(state) {

        super.buildTaskToolbar(state);

        const toolbar = document.querySelector(
            "#taskContextToolbar"
        );

        if (toolbar) {
            toolbar.open =
                this.shouldExpandToolbar(state);
            toolbar.dataset.viewportMode =
                this.isMobileViewport()
                    ? "mobile"
                    : "desktop";
        }

        if (!this.isMobileViewport()) {
            return;
        }

        this.prepareMobileToggle(toolbar);
        this.decorateMobileControls(state);

    }

    getToggleIcon(toolbar) {

        return toolbar?.open
            ? "chevronUp"
            : "chevronDown";

    }

    getToggleAccessibleLabel(toolbar) {

        return toolbar?.open
            ? "Ocultar controles de la lista"
            : "Mostrar controles de la lista";

    }

    renderToggleIcon(toolbar) {

        return renderMobileIcon(
            this.getToggleIcon(toolbar)
        );

    }

    updateToggleElement(element, toolbar) {

        if (!element) return;

        const accessibleLabel =
            this.getToggleAccessibleLabel(toolbar);

        element.innerHTML =
            this.renderToggleIcon(toolbar);
        element.setAttribute(
            "aria-label",
            accessibleLabel
        );
        element.setAttribute(
            "title",
            accessibleLabel
        );
        element.setAttribute(
            "aria-expanded",
            String(Boolean(toolbar?.open))
        );

    }

    prepareMobileToggle(toolbar) {

        const summary = toolbar?.querySelector(
            ".taskContextToolbarSummary"
        );

        if (!summary) return;

        summary.classList.add(
            "mobileTaskToolbarToggle"
        );

        const updateLabel = () => {
            this.updateToggleElement(
                summary,
                toolbar
            );
            this.updateToggleElement(
                document.querySelector(
                    ".mobileTaskToolbarHeadingToggle"
                ),
                toolbar
            );
        };

        updateLabel();

        if (
            summary.dataset.mobileToggleBound !== "true"
        ) {
            summary.dataset.mobileToggleBound = "true";
            toolbar.addEventListener(
                "toggle",
                updateLabel
            );
        }

    }

    decorateHeadingToggle(toolbar) {

        const summary = document.querySelector(
            ".taskViewSummary"
        );

        if (!toolbar || !summary) {
            toolbar?.classList.remove(
                "mobileTaskToolbarHeadingToggleReady"
            );
            return;
        }

        let items = summary.querySelector(
            ":scope > .mobileTaskToolbarSummaryItems"
        );

        if (!items) {
            items = document.createElement("span");
            items.className =
                "mobileTaskToolbarSummaryItems";

            Array.from(summary.children)
                .filter(element =>
                    element.classList.contains(
                        "taskViewSummaryItem"
                    )
                )
                .forEach(element => {
                    items.append(element);
                });

            summary.prepend(items);
        }

        let button = items.querySelector(
            ":scope > .mobileTaskToolbarHeadingToggle"
        );

        if (!button) {
            button = summary.querySelector(
                ":scope > .mobileTaskToolbarHeadingToggle"
            );
        }

        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.className =
                "mobileTaskToolbarHeadingToggle";
            button.addEventListener("click", () => {
                toolbar.open = !toolbar.open;
                this.setMobileToolbarExpanded(
                    toolbar.open
                );
            });
        }

        items.append(button);

        this.updateToggleElement(
            button,
            toolbar
        );
        toolbar.classList.add(
            "mobileTaskToolbarHeadingToggleReady"
        );

    }

    decorateMobileControls(state = {}) {

        if (!this.isMobileViewport()) return;

        const toolbar = document.getElementById(
            "taskContextToolbar"
        );
        const body = toolbar?.querySelector(
            ".taskContextToolbarBody"
        );

        if (!toolbar || !body) return;

        this.prepareMobileToggle(toolbar);
        this.decorateHeadingToggle(toolbar);
        this.decorateFiltersButton();
        this.observeLateToolbarControls(body);
        this.decorateToolbarSelects();

        const utilities = body.querySelector(
            ".taskContextToolbarUtilities"
        );

        if (state.bulkSelectionMode) {
            toolbar.classList.add(
                "mobileTaskToolbarBulkMode"
            );
            this.unwrapUtilities(utilities);
        } else {
            toolbar.classList.remove(
                "mobileTaskToolbarBulkMode"
            );
            this.wrapUtilities(utilities);
        }

        const filtersActive = Boolean(
            document.getElementById("openTaskTools")
                ?.classList.contains("active")
        );
        const groupingActive =
            document.getElementById("taskGrouping")
                ?.value !== "NONE";

        toolbar.querySelector(
            ".mobileTaskToolbarToggle"
        )?.classList.toggle(
            "active",
            Boolean(filtersActive || groupingActive)
        );

    }

    observeLateToolbarControls(body) {

        this.toolbarObserver?.disconnect?.();
        this.toolbarObserver = null;

        const Observer =
            this.window?.MutationObserver ??
            globalThis.MutationObserver;

        if (typeof Observer !== "function") return;

        this.toolbarObserver = new Observer(mutations => {
            const relevant = mutations.some(mutation =>
                Array.from(mutation.addedNodes ?? [])
                    .some(node =>
                        node?.id === "taskSort" ||
                        node?.id === "taskGrouping" ||
                        node?.querySelector?.(
                            "#taskSort, #taskGrouping"
                        )
                    )
            );

            if (relevant) {
                this.decorateToolbarSelects();
            }
        });

        this.toolbarObserver.observe(body, {
            childList: true,
            subtree: true
        });

    }

    decorateToolbarSelects() {

        this.decorateSelect(
            document.getElementById("taskSort"),
            {
                icon: "sort",
                label: "Ordenar tareas"
            }
        );
        this.decorateSelect(
            document.getElementById("taskGrouping"),
            {
                icon: "group",
                label: "Agrupar tareas"
            }
        );

    }

    decorateFiltersButton() {

        const button = document.getElementById(
            "openTaskTools"
        );

        if (!button) return;

        button.classList.add(
            "mobileTaskToolbarAction"
        );
        button.setAttribute("aria-label", "Filtrar tareas");
        button.setAttribute("title", "Filtrar tareas");
        button.innerHTML = renderMobileIcon("filter");

    }

    decorateSelect(
        select,
        {
            icon,
            label
        }
    ) {

        const wrapper = select?.closest(
            ".taskContextToolbarSort"
        );

        if (!select || !wrapper) return;

        select.classList.remove(
            "mobileFilterNativeSelect"
        );
        delete select.dataset.mobileFilterEnhanced;

        this.document?.querySelector?.(
            `.mobileFilterSelect[data-for="${select.id}"]`
        )?.remove();

        wrapper.classList.add(
            "mobileTaskToolbarSelect"
        );
        wrapper.setAttribute("title", label);
        select.setAttribute("aria-label", label);

        let iconElement = wrapper.querySelector(
            ":scope > .mobileTaskToolbarSelectIcon"
        );

        if (!iconElement) {
            iconElement = document.createElement(
                "span"
            );
            iconElement.className =
                "mobileTaskToolbarSelectIcon";
            wrapper.prepend(iconElement);
        }

        iconElement.innerHTML = renderMobileIcon(icon);

    }

    wrapUtilities(utilities) {

        if (!utilities) return;

        const existing = utilities.closest(
            ".mobileTaskToolbarMore"
        );

        if (existing) return;

        const details = document.createElement(
            "details"
        );
        details.className = "mobileTaskToolbarMore";

        const summary = document.createElement(
            "summary"
        );
        summary.className =
            "mobileTaskToolbarMoreSummary";
        summary.setAttribute(
            "aria-label",
            "Más opciones de la lista"
        );
        summary.setAttribute(
            "title",
            "Más opciones"
        );
        summary.innerHTML = renderMobileIcon("more");

        utilities.before(details);
        details.append(summary, utilities);

    }

    unwrapUtilities(utilities) {

        const details = utilities?.closest(
            ".mobileTaskToolbarMore"
        );

        if (!details || !utilities) return;

        details.before(utilities);
        details.remove();

    }

}
