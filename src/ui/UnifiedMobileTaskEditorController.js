import {
    MobileTaskEditorLayoutController
} from "./MobileTaskEditorLayoutController.js";
import {
    enhanceCompactMobileTaskEditor
} from "./MobileTaskEditorCompactEnhancer.js";

export class UnifiedMobileTaskEditorController
    extends MobileTaskEditorLayoutController {

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
