import { View } from "../core/View.js";

const CONSUMED_PARAMETERS = [
    "capture",
    "shortcut",
    "title",
    "text",
    "url"
];

function clean(value) {
    return String(value ?? "").trim();
}

function uniqueParts(parts) {
    const seen = new Set();

    return parts.filter(part => {
        const value = clean(part);

        if (!value || seen.has(value)) return false;

        seen.add(value);
        return true;
    });
}

export function createSharedTaskDraft({
    title = "",
    text = "",
    url = ""
} = {}) {
    const sharedTitle = clean(title);
    const sharedText = clean(text);
    const sharedUrl = clean(url);
    let taskTitle = sharedTitle;
    let remainingText = sharedText;

    if (
        !taskTitle &&
        !sharedUrl &&
        /^https?:\/\/\S+$/i.test(sharedText)
    ) {
        return {
            title: "Revisar enlace",
            description: sharedText
        };
    }

    if (!taskTitle && sharedText) {
        const [firstLine, ...remainingLines] =
            sharedText.split(/\r?\n/);

        taskTitle = clean(firstLine);
        remainingText = clean(
            remainingLines.join("\n")
        );
    }

    if (!taskTitle && sharedUrl) {
        taskTitle = "Revisar enlace";
    }

    if (
        remainingText === taskTitle ||
        remainingText === sharedUrl
    ) {
        remainingText = "";
    }

    if (remainingText && sharedUrl) {
        remainingText = remainingText
            .split(/\r?\n/)
            .filter(line => clean(line) !== sharedUrl)
            .join("\n")
            .trim();
    }

    return {
        title: taskTitle,
        description: uniqueParts([
            remainingText,
            sharedUrl
        ]).join("\n\n")
    };
}

export function getPwaLaunchRequest(url) {
    let parsed;

    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    const shortcut = parsed.searchParams.get("shortcut");

    if (["new-task", "inbox", "today"].includes(shortcut)) {
        return {
            type: "shortcut",
            shortcut
        };
    }

    const hasSharedContent = [
        "title",
        "text",
        "url"
    ].some(parameter =>
        clean(parsed.searchParams.get(parameter))
    );

    if (
        parsed.searchParams.get("capture") === "share" ||
        hasSharedContent
    ) {
        return {
            type: "share",
            draft: createSharedTaskDraft({
                title: parsed.searchParams.get("title"),
                text: parsed.searchParams.get("text"),
                url: parsed.searchParams.get("url")
            })
        };
    }

    return null;
}

export class PwaLaunchController {
    constructor(
        app,
        taskCreationController,
        {
            windowRef = globalThis.window
        } = {}
    ) {
        this.app = app;
        this.taskCreationController =
            taskCreationController;
        this.window = windowRef;
        this.started = false;
    }

    start() {
        if (this.started || !this.app?.start) return;

        this.started = true;
        const originalStart = this.app.start.bind(this.app);

        this.app.start = (...args) => {
            const result = originalStart(...args);
            this.consumeLaunchRequest();
            return result;
        };
    }

    consumeLaunchRequest() {
        const href = this.window?.location?.href;
        const request = getPwaLaunchRequest(href);

        if (!request) return false;

        if (request.type === "share") {
            this.app.currentView = View.INBOX;
            this.taskCreationController
                ?.openCreationDraft(request.draft);
        } else if (request.shortcut === "new-task") {
            this.app.currentView = View.INBOX;
            this.taskCreationController
                ?.openCreationDraft();
        } else {
            this.app.navigateTo(
                request.shortcut === "inbox"
                    ? View.INBOX
                    : View.TODAY
            );
        }

        this.clearConsumedParameters();
        return true;
    }

    clearConsumedParameters() {
        const href = this.window?.location?.href;

        try {
            const url = new URL(href);

            CONSUMED_PARAMETERS.forEach(parameter =>
                url.searchParams.delete(parameter)
            );

            const cleanUrl =
                url.pathname +
                (url.search ? url.search : "") +
                url.hash;

            this.window?.history?.replaceState?.(
                null,
                "",
                cleanUrl
            );
        } catch {
            // La captura ya fue abierta; una URL extraña no debe cerrarla.
        }
    }
}
