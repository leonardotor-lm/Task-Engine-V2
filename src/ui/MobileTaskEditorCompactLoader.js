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

const attachmentStateObserver = new MutationObserver(
    closeInitialAttachmentsPanel
);
attachmentStateObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"]
});

closeInitialAttachmentsPanel();
import("./MobileTaskEditorCompactEnhancer.js");
