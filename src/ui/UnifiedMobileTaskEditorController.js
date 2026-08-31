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

    constructor(...args) {
        super(...args);
        this.mobileEditorObserver = null;
    }

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

        if (!notes || !grid) {
            return false;
        }

        if (
            notes.classList.contains(
                "mobileTaskEditorNotesTool"
            )
        ) {
            if (notes.parentElement !== grid) {
                grid.append(notes);
            }
            return true;
        }

        const summary = notes.querySelector(
            ":scope > summary"
        );
        const body = notes.querySelector(
            ":scope > .editorSectionBody"
        );

        if (!summary || !body) return false;

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
            close.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                notes.open = false;
                body.hidden = true;
                summary.focus();
            });

            header.append(title, close);
            body.prepend(header);
        }

        notes.addEventListener("toggle", () => {
            body.hidden = !notes.open;
            if (!notes.open) return;

            drawer.querySelectorAll(
                ".mobileTaskEditorCompactTransient[open]"
            ).forEach(panel => {
                if (panel !== notes) panel.open = false;
            });
        });

        body.hidden = !notes.open;
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

        return true;
    }

    ensureProgrammingIcon(drawer) {
        const summary = drawer?.querySelector(
            ".mobileTaskEditorRecurrenceTool > summary"
        );

        if (!summary) return false;

        summary.classList.add(
            "mobileTaskEditorCompactSummary",
            "mobileTaskEditorProgrammingSummary"
        );
        summary.setAttribute(
            "aria-label",
            "Programación"
        );
        summary.setAttribute(
            "title",
            "Programación"
        );
        summary.innerHTML = Icon.render(
            "repeat",
            "mobileTaskEditorCompactIcon"
        );

        return true;
    }

    bindCompactCloseButtons(drawer) {
        drawer?.querySelectorAll(
            ".mobileTaskEditorCompactPanelClose"
        ).forEach(button => {
            if (
                button.dataset.compactCloseBound === "true"
            ) {
                return;
            }

            button.dataset.compactCloseBound = "true";
            button.addEventListener(
                "click",
                event => {
                    const details = button.closest("details");
                    const body = button.closest(
                        ".mobileTaskEditorCompactPanel"
                    );

                    if (!details) return;

                    event.preventDefault();
                    event.stopPropagation();
                    details.open = false;
                    if (body) body.hidden = true;
                    details.querySelector(
                        ":scope > summary"
                    )?.focus();
                },
                true
            );
        });
    }

    reconcileCompactEditor(drawer) {
        enhanceCompactMobileTaskEditor(drawer);
        this.ensureProgrammingIcon(drawer);
        this.promoteNotionNotes(drawer);
        this.bindCompactCloseButtons(drawer);
    }

    observeCompactEditor(drawer) {
        this.mobileEditorObserver?.disconnect?.();
        this.mobileEditorObserver = null;

        const Observer =
            this.window?.MutationObserver ??
            globalThis.MutationObserver;

        if (typeof Observer !== "function") return;

        this.mobileEditorObserver = new Observer(() => {
            if (!drawer.isConnected) {
                this.mobileEditorObserver?.disconnect?.();
                this.mobileEditorObserver = null;
                return;
            }

            this.ensureProgrammingIcon(drawer);
            this.promoteNotionNotes(drawer);
            this.bindCompactCloseButtons(drawer);
        });

        this.mobileEditorObserver.observe(drawer, {
            childList: true,
            subtree: true
        });
    }

    enhanceEditor() {
        super.enhanceEditor();

        if (
            !window.matchMedia("(max-width: 760px)").matches
        ) {
            this.mobileEditorObserver?.disconnect?.();
            this.mobileEditorObserver = null;
            return;
        }

        const drawer = document.querySelector(
            ".mobileTaskEditorLayout:not(.recoveryPanel)"
        );

        if (!drawer) return;

        this.reconcileCompactEditor(drawer);
        this.observeCompactEditor(drawer);
    }
}
