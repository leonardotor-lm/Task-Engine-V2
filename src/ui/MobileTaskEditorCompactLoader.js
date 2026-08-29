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

            .mobileTaskEditorCompactLayout
                .mobileTaskEditorFooter {
                position: static !important;
                inset: auto !important;
                z-index: auto !important;
            }

            .mobileTaskEditorCompactOverflowNotes {
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                background: transparent !important;
            }

            .mobileTaskEditorCompactOverflowNotes > summary {
                box-sizing: border-box !important;
                width: 100% !important;
                min-height: 44px !important;
                margin: 0 !important;
                padding: 9px 10px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface) !important;
                color: var(--color-text-subtle) !important;
                font-size: 14px !important;
                font-weight: 400 !important;
                list-style: none !important;
                cursor: pointer !important;
            }

            .mobileTaskEditorCompactOverflowNotes > summary::-webkit-details-marker {
                display: none !important;
            }

            .mobileTaskEditorCompactOverflowNotes > .editorSectionBody {
                display: grid !important;
                gap: 8px !important;
                margin: 6px 0 0 !important;
                padding: 8px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface-subtle) !important;
            }

            .mobileTaskEditorCompactOverflowNotes .fieldHelp,
            .mobileTaskEditorCompactOverflowNotes .syncErrorHint {
                margin: 0 !important;
                font-size: 12px !important;
                line-height: 1.35 !important;
            }

            .mobileTaskEditorCompactOverflowNotes .taskEditorActions {
                display: grid !important;
                gap: 6px !important;
                margin: 0 !important;
            }

            .mobileTaskEditorCompactOverflowNotes a,
            .mobileTaskEditorCompactOverflowNotes button {
                display: flex !important;
                align-items: center !important;
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
                text-align: left !important;
                text-decoration: none !important;
            }
        }
    `;
    document.head.append(style);
}

const MOBILE_LAYOUT_MEDIA = "(max-width: 760px)";

function isMobileViewport() {
    return window.matchMedia(MOBILE_LAYOUT_MEDIA).matches;
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

function ensureOverflowSection(
    overflowPanel,
    className,
    titleText
) {
    let section = overflowPanel.querySelector(
        `.${className}`
    );

    if (section) return section;

    const title = document.createElement("strong");
    title.className =
        "mobileTaskEditorCompactOverflowTitle";
    title.textContent = titleText;

    section = document.createElement("div");
    section.className = className;

    overflowPanel.append(title, section);
    return section;
}

function placeSectionBeforeActions(
    overflowPanel,
    section
) {
    const actions = overflowPanel.querySelector(
        ".mobileTaskEditorCompactOverflowActions"
    );

    if (!actions) return;

    const actionsTitle = actions.previousElementSibling;
    const sectionTitle = section.previousElementSibling;

    if (
        !sectionTitle?.classList.contains(
            "mobileTaskEditorCompactOverflowTitle"
        )
    ) {
        return;
    }

    const anchor =
        actionsTitle?.classList.contains(
            "mobileTaskEditorCompactOverflowTitle"
        )
            ? actionsTitle
            : actions;

    overflowPanel.insertBefore(sectionTitle, anchor);
    overflowPanel.insertBefore(section, anchor);
}

function relocateMoveFallback() {
    const drawer = getCompactDrawer();
    const overflowPanel = getOverflowPanel(drawer);

    if (!drawer || !overflowPanel) return false;

    const moveButton =
        drawer.querySelector(".mobileTaskEditorMoveTool") ??
        Array.from(
            drawer.querySelectorAll(
                ".mobileTaskEditorToolButton"
            )
        ).find(button =>
            button.textContent.trim() === "Mover"
        );

    if (!moveButton) return false;

    if (
        moveButton.closest(
            ".mobileTaskEditorCompactOverflowOptions"
        )
    ) {
        return true;
    }

    const options = ensureOverflowSection(
        overflowPanel,
        "mobileTaskEditorCompactOverflowOptions",
        "Opciones"
    );

    options.append(moveButton);
    return true;
}

function relocateNotionNotes() {
    const drawer = getCompactDrawer();
    const notionSection = drawer?.querySelector(
        ".editorNotionSection:not(.mobileTaskEditorCompactOverflowNotes)"
    );
    const overflowPanel = getOverflowPanel(drawer);

    if (!drawer || !notionSection || !overflowPanel) {
        return false;
    }

    notionSection.classList.add(
        "mobileTaskEditorCompactOverflowNotes"
    );

    const notes = ensureOverflowSection(
        overflowPanel,
        "mobileTaskEditorCompactOverflowNotesContainer",
        "Notas"
    );

    placeSectionBeforeActions(overflowPanel, notes);
    notes.append(notionSection);
    return true;
}

function synchronizeCompactEditorOnce() {
    if (!isMobileViewport()) return;

    relocateMoveFallback();
    relocateNotionNotes();
}

function scheduleBoundedSynchronization() {
    [0, 40, 120].forEach(delay => {
        window.setTimeout(
            synchronizeCompactEditorOnce,
            delay
        );
    });
}

function containsRelevantEditorAddition(node) {
    if (!(node instanceof Element)) return false;

    return Boolean(
        node.matches?.(
            ".mobileTaskEditorLayout, " +
            ".mobileTaskEditorCompactLayout, " +
            ".mobileTaskEditorCompactOverflowPanel, " +
            ".mobileTaskEditorMoveTool, " +
            ".editorNotionSection"
        ) ||
        node.querySelector?.(
            ".mobileTaskEditorLayout, " +
            ".mobileTaskEditorCompactLayout, " +
            ".mobileTaskEditorCompactOverflowPanel, " +
            ".mobileTaskEditorMoveTool, " +
            ".editorNotionSection"
        )
    );
}

function handleEditorMutations(mutations) {
    if (!isMobileViewport()) return;

    const hasRelevantAddition = mutations.some(
        mutation => Array.from(mutation.addedNodes)
            .some(containsRelevantEditorAddition)
    );

    if (hasRelevantAddition) {
        scheduleBoundedSynchronization();
    }
}

const editorObserver = new MutationObserver(
    handleEditorMutations
);

editorObserver.observe(document.body, {
    childList: true,
    subtree: true
});

import("./MobileTaskEditorCompactEnhancer.js")
    .then(scheduleBoundedSynchronization);
