import {
    TaskToolbarController
} from "./TaskToolbarController.js";

const MOBILE_TOOLBAR_STORAGE_KEY =
    "task-engine-v2-mobile-task-toolbar-expanded-v2";

export class CompactTaskToolbarController
    extends TaskToolbarController {

    isMobileToolbarExpanded() {

        return this.readBooleanPreference(
            MOBILE_TOOLBAR_STORAGE_KEY,
            false
        );

    }

    setMobileToolbarExpanded(expanded) {

        this.writeBooleanPreference(
            MOBILE_TOOLBAR_STORAGE_KEY,
            expanded
        );

    }

    buildTaskToolbar(state) {

        super.buildTaskToolbar(state);

        const label = document.querySelector(
            "#taskContextToolbar .taskContextToolbarSummary span"
        );

        if (label) {
            label.textContent = "Herramientas";
        }

    }

}
