const stylesheetHref =
    "styles/task-editor-mobile-compact.css";

if (!document.querySelector(
    `link[href="${stylesheetHref}"]`
)) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = stylesheetHref;
    document.head.append(stylesheet);
}

const overflowFixStyleId =
    "mobile-task-editor-overflow-fix";

if (!document.getElementById(overflowFixStyleId)) {
    const style = document.createElement("style");
    style.id = overflowFixStyleId;
    style.textContent = `
        @media (max-width: 760px) {
            .mobileTaskEditorCompactOverflowActions #toggleTask,
            .mobileTaskEditorCompactOverflowActions #reopenTask,
            .mobileTaskEditorCompactOverflowActions #archiveTask,
            .mobileTaskEditorCompactOverflowActions #deleteTask,
            .mobileTaskEditorCompactOverflowActions #skipRecurringTask {
                display: block !important;
                box-sizing: border-box !important;
                width: 100% !important;
                min-height: 44px !important;
                margin: 0 !important;
                padding: 9px 10px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface) !important;
                color: var(--color-text-subtle) !important;
                font: inherit !important;
                font-size: 14px !important;
                font-weight: 400 !important;
                line-height: 1.3 !important;
                text-align: left !important;
            }

            .mobileTaskEditorCompactOverflowActions #deleteTask {
                color: var(--color-danger) !important;
            }
        }
    `;
    document.head.append(style);
}

function closeInitialAttachmentsPanel() {
    document.querySelectorAll(
        ".mobileTaskEditorCompactAttachments"
    ).forEach(panel => {
        if (
            panel.dataset.mobileCompactInitialState ===
            "closed"
        ) {
            return;
        }

        panel.open = false;
        panel.dataset.mobileCompactInitialState =
            "closed";
    });
}

function relocateMoveFallback() {
    const drawer = document.querySelector(
        ".mobileTaskEditorCompactLayout:not(.recoveryPanel)"
    );
    const grid = drawer?.querySelector(
        ".mobileTaskEditorToolGrid"
    );

    if (!drawer || !grid) return;

    const moveButton = Array.from(
        grid.querySelectorAll(".mobileTaskEditorToolButton")
    ).find(button =>
        button.textContent.trim() === "Mover"
    );

    if (!moveButton) return;

    const overflowPanel = drawer.querySelector(
        ".mobileTaskEditorCompactOverflowPanel"
    );

    if (!overflowPanel) {
        moveButton.remove();
        return;
    }

    let options = overflowPanel.querySelector(
        ".mobileTaskEditorCompactOverflowOptions"
    );

    if (!options) {
        const title = document.createElement("strong");
        title.className =
            "mobileTaskEditorCompactOverflowTitle";
        title.textContent = "Opciones";

        options = document.createElement("div");
        options.className =
            "mobileTaskEditorCompactOverflowOptions";

        overflowPanel.prepend(title, options);
    }

    options.append(moveButton);
}

function synchronizeCompactEditorOnce() {
    closeInitialAttachmentsPanel();
    relocateMoveFallback();
}

import("./MobileTaskEditorCompactEnhancer.js")
    .then(() => {
        queueMicrotask(synchronizeCompactEditorOnce);
        window.setTimeout(
            synchronizeCompactEditorOnce,
            0
        );
    });
