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

import("./MobileTaskEditorCompactEnhancer.js");
