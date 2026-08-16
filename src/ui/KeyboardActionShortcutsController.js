export class KeyboardActionShortcutsController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.handleKeydown =
            this.handleKeydown.bind(this);

    }

    start() {

        if (
            this.started ||
            !this.document?.addEventListener
        ) {
            return;
        }

        this.started = true;
        this.document.addEventListener(
            "keydown",
            this.handleKeydown
        );

    }

    stop() {

        if (
            !this.started ||
            !this.document?.removeEventListener
        ) {
            return;
        }

        this.document.removeEventListener(
            "keydown",
            this.handleKeydown
        );
        this.started = false;

    }

    handleKeydown(event) {

        if (
            !event ||
            event.defaultPrevented ||
            !event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            this.isEditableTarget(event.target)
        ) {
            return;
        }

        const key = String(event.key ?? "")
            .toLowerCase();

        if (key === "n") {
            this.activateNewTask(event);
            return;
        }

        if (key === "b") {
            this.focusSearch(event);
            return;
        }

        if (key === "c") {
            this.completeFocusedTask(event);
        }

    }

    activateNewTask(event) {

        const button = this.document
            ?.getElementById?.("openTaskCreation");

        if (!button || button.disabled) return;

        event.preventDefault?.();
        button.click?.();

    }

    focusSearch(event) {

        const input = this.document
            ?.getElementById?.("taskSearchInput");

        if (!input || input.disabled) return;

        event.preventDefault?.();
        input.focus?.();
        input.select?.();

    }

    completeFocusedTask(event) {

        const row = event.target?.classList
            ?.contains?.("task")
            ? event.target
            : null;

        if (!row) return;

        const checkbox = row.querySelector?.(
            ".taskCompleteCheckbox"
        );

        if (!checkbox || checkbox.disabled) return;

        event.preventDefault?.();
        checkbox.click?.();

    }

    isEditableTarget(target) {

        if (!target) return false;

        const tagName = String(
            target.tagName ?? ""
        ).toUpperCase();

        if (
            ["INPUT", "TEXTAREA", "SELECT"]
                .includes(tagName)
        ) {
            return true;
        }

        return Boolean(
            target.isContentEditable ||
            target.closest?.("[contenteditable='true']")
        );

    }

}
