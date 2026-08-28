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
            .mobileTaskEditorCompactOverflowActions button,
            .mobileTaskEditorCompactOverflowNotes button,
            .mobileTaskEditorCompactOverflowNotes a {
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
                text-decoration: none !important;
            }

            .mobileTaskEditorCompactOverflowActions #deleteTask {
                color: var(--color-danger) !important;
            }

            .mobileTaskEditorCompactOverflowNotes {
                display: grid;
                gap: 6px;
            }

            .mobileTaskEditorCompactOverflowNotes .fieldHelp,
            .mobileTaskEditorCompactOverflowNotes .syncErrorHint {
                margin: 0;
                font-size: 12px;
                line-height: 1.4;
            }

            .mobileTaskEditorCompactOverflowNotes .taskEditorActions {
                display: grid !important;
                gap: 6px !important;
                margin: 0 !important;
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

function getCompactDrawer() {
    return document.querySelector(
        ".mobileTaskEditorCompactLayout:not(.recoveryPanel)"
    );
}

function getOverflowPanel(drawer) {
    return drawer?.querySelector(
        ".mobileTaskEditorCompactOverflowPanel"
    ) ?? null;
}

function ensureOverflowGroup(
    panel,
    className,
    titleText
) {
    let group = panel?.querySelector(`.${className}`);
    if (group) return group;

    if (!panel) return null;

    const title = document.createElement("strong");
    title.className =
        "mobileTaskEditorCompactOverflowTitle";
    title.textContent = titleText;

    group = document.createElement("div");
    group.className = className;

    panel.append(title, group);
    return group;
}

function relocateMoveFallback(drawer) {
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

    const overflowPanel = getOverflowPanel(drawer);

    if (!overflowPanel) {
        moveButton.remove();
        return;
    }

    const options = ensureOverflowGroup(
        overflowPanel,
        "mobileTaskEditorCompactOverflowOptions",
        "Opciones"
    );

    options?.append(moveButton);
}

function relocateTaskActions(drawer) {
    const overflowPanel = getOverflowPanel(drawer);
    if (!overflowPanel) return;

    const actionIds = [
        "reopenTask",
        "toggleTask",
        "archiveTask",
        "skipRecurringTask",
        "deleteTask"
    ];

    const buttons = actionIds
        .map(id => drawer.querySelector(`#${id}`))
        .filter(Boolean);

    if (buttons.length === 0) return;

    const actions = ensureOverflowGroup(
        overflowPanel,
        "mobileTaskEditorCompactOverflowActions",
        "Acciones"
    );

    buttons.forEach(button => actions?.append(button));
}

function relocateNotionNotes(drawer) {
    const section = drawer?.querySelector(
        ".editorNotionSection"
    );
    const overflowPanel = getOverflowPanel(drawer);

    if (!section || !overflowPanel) return;

    const body = section.querySelector(
        ":scope > .editorSectionBody"
    );

    if (!body) return;

    const notes = ensureOverflowGroup(
        overflowPanel,
        "mobileTaskEditorCompactOverflowNotes",
        "Notas"
    );

    while (body.firstChild) {
        notes?.append(body.firstChild);
    }

    section.remove();
}

function synchronizeCompactEditor() {
    closeInitialAttachmentsPanel();

    const drawer = getCompactDrawer();
    if (!drawer) return;

    relocateMoveFallback(drawer);
    relocateTaskActions(drawer);
    relocateNotionNotes(drawer);
}

const compactStateObserver = new MutationObserver(() => {
    queueMicrotask(synchronizeCompactEditor);
});
compactStateObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
});

synchronizeCompactEditor();
import("./MobileTaskEditorCompactEnhancer.js")
    .then(() => queueMicrotask(synchronizeCompactEditor));
