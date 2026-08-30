import {
    MobileTaskEditorLayoutController
} from "./MobileTaskEditorLayoutController.js";
import {
    enhanceCompactMobileTaskEditor
} from "./MobileTaskEditorCompactEnhancer.js";

const COMPACT_STYLESHEET =
    "styles/task-editor-mobile-compact.css";
const DENSITY_STYLESHEET =
    "styles/task-editor-mobile-density.css";

export class UnifiedMobileTaskEditorController
    extends MobileTaskEditorLayoutController {

    start() {
        this.preloadCompactStylesheets();
        super.start();
    }

    preloadCompactStylesheets() {
        for (const href of [
            COMPACT_STYLESHEET,
            DENSITY_STYLESHEET
        ]) {
            if (
                document.querySelector(
                    `link[href="${href}"]`
                )
            ) {
                continue;
            }

            const stylesheet = document.createElement("link");
            stylesheet.rel = "stylesheet";
            stylesheet.href = href;
            document.head.append(stylesheet);
        }
    }

    bindTransientPanels() {
        // La etapa compacta administra todos los paneles móviles,
        // incluidos los creados por la estructura base.
    }

    buildToolGrid(options) {
        super.buildToolGrid(options);

        const drawer = document.querySelector(
            ".mobileTaskEditorLayout:not(.recoveryPanel)"
        );
        const unavailableMove = drawer?.querySelector(
            ".mobileTaskEditorToolGrid > .mobileTaskEditorToolButton"
        );

        if (
            unavailableMove?.disabled &&
            unavailableMove.textContent?.trim() === "Mover"
        ) {
            unavailableMove.remove();
        }
    }

    enhanceEditor() {
        super.enhanceEditor();

        if (
            !window.matchMedia("(max-width: 760px)").matches
        ) {
            return;
        }

        const drawer = document.querySelector(
            ".mobileTaskEditorLayout:not(.recoveryPanel)"
        );

        if (!drawer) return;

        enhanceCompactMobileTaskEditor(drawer);
    }
}
