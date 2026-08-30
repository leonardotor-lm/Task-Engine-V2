import {
    MobileTaskEditorLayoutController
} from "./MobileTaskEditorLayoutController.js";
import {
    enhanceCompactMobileTaskEditor
} from "./MobileTaskEditorCompactEnhancer.js";
import { Icon } from "./Icon.js";

const COMPACT_STYLESHEET =
    "styles/task-editor-mobile-compact.css";
const DENSITY_STYLESHEET =
    "styles/task-editor-mobile-density.css";
const DEVICE_FIXES_STYLESHEET =
    "styles/task-editor-mobile-device-fixes.css";

export class UnifiedMobileTaskEditorController
    extends MobileTaskEditorLayoutController {

    start() {
        this.preloadCompactStylesheets();
        super.start();
    }

    preloadCompactStylesheets() {
        for (const href of [
            COMPACT_STYLESHEET,
            DENSITY_STYLESHEET,
            DEVICE_FIXES_STYLESHEET
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

    promoteNotionNotes(drawer) {
        const notes = drawer?.querySelector(
            ".editorNotionSection"
        );
        const grid = drawer?.querySelector(
            ".mobileTaskEditorToolGrid"
        );

        if (
            !notes ||
            !grid ||
            notes.classList.contains(
                "mobileTaskEditorNotesTool"
            )
        ) {
            return;
        }

        const summary = notes.querySelector(
            ":scope > summary"
        );
        const body = notes.querySelector(
            ":scope > .editorSectionBody"
        );

        if (!summary || !body) return;

        const previousContainer = notes.closest(
            ".mobileTaskEditorCompactOverflowNotesContainer"
        );
        const previousTitle =
            previousContainer?.previousElementSibling;

        notes.classList.remove(
            "mobileTaskEditorCompactOverflowNotes"
        );
        notes.classList.add(
            "mobileTaskEditorCompactTool",
            "mobileTaskEditorCompactTransient",
            "mobileTaskEditorNotesTool"
        );
        summary.classList.add(
            "mobileTaskEditorCompactSummary"
        );
        summary.innerHTML = `
            ${Icon.render(
                "note",
                "mobileTaskEditorCompactIcon"
            )}
            <span class="mobileTaskEditorCompactLabel">
                Notas
            </span>
        `;
        body.classList.add(
            "mobileTaskEditorCompactPanel"
        );

        if (
            !body.querySelector(
                ":scope > .mobileTaskEditorCompactPanelHeader"
            )
        ) {
            const header = document.createElement("div");
            header.className =
                "mobileTaskEditorCompactPanelHeader";

            const title = document.createElement("strong");
            title.textContent = "Notas";

            const close = document.createElement("button");
            close.type = "button";
            close.className =
                "mobileTaskEditorCompactPanelClose";
            close.setAttribute(
                "aria-label",
                "Cerrar notas"
            );
            close.textContent = "×";
            close.addEventListener("click", () => {
                notes.open = false;
                summary.focus();
            });

            header.append(title, close);
            body.prepend(header);
        }

        notes.addEventListener("toggle", () => {
            if (!notes.open) return;

            drawer.querySelectorAll(
                ".mobileTaskEditorCompactTransient[open]"
            ).forEach(panel => {
                if (panel !== notes) panel.open = false;
            });
        });

        grid.append(notes);
        previousContainer?.remove();

        if (
            previousTitle?.classList.contains(
                "mobileTaskEditorCompactOverflowTitle"
            ) &&
            previousTitle.textContent?.trim() === "Notas"
        ) {
            previousTitle.remove();
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
        this.promoteNotionNotes(drawer);
    }
}
