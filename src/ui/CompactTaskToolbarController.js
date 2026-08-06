import {
    TaskToolbarController
} from "./TaskToolbarController.js";

const MOBILE_TOOLBAR_STORAGE_KEY =
    "task-engine-v2-mobile-task-toolbar-expanded-v2";

const MOBILE_LAYOUT_MEDIA =
    "(max-width: 760px)";

export class CompactTaskToolbarController
    extends TaskToolbarController {

    constructor(
        app,
        {
            storage = globalThis.localStorage,
            windowRef = globalThis.window
        } = {}
    ) {

        super(app, { storage });
        this.window = windowRef;

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

        const label = document.querySelector(
            "#taskContextToolbar .taskContextToolbarSummary span"
        );

        if (label) {
            label.textContent = "Herramientas";
        }

    }

}
