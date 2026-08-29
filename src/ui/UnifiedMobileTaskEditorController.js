import {
    MobileTaskEditorLayoutController
} from "./MobileTaskEditorLayoutController.js";
import {
    enhanceCompactMobileTaskEditor
} from "./MobileTaskEditorCompactEnhancer.js";

const COMPACT_STYLESHEET =
    "styles/task-editor-mobile-compact.css";

export class UnifiedMobileTaskEditorController
    extends MobileTaskEditorLayoutController {

    start() {
        this.preloadCompactStylesheet();
        super.start();
    }

    preloadCompactStylesheet() {
        if (
            document.querySelector(
                `link[href="${COMPACT_STYLESHEET}"]`
            )
        ) {
            return;
        }

        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = COMPACT_STYLESHEET;
        document.head.append(stylesheet);
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
