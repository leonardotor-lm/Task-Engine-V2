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

function synchronizeCompactEditor() {
    closeInitialAttachmentsPanel();
    relocateMoveFallback();
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
