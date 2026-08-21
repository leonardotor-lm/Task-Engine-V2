export const AI_SIDEBAR_TOOL_IDS = Object.freeze([
    "openAiAssistant",
    "openAiPriorityProposal",
    "openAiDueDateProposal",
    "openAiWaitingProposal",
    "openAiOrganizationProposal",
    "openAiProjectProposal",
    "openAiTaskQuality"
]);

function extractButton(html, id) {
    const pattern = new RegExp(
        `\\n\\s*<button\\s+[\\s\\S]*?id=["']${id}["'][\\s\\S]*?<\\/button>`,
        "i"
    );
    const match = html.match(pattern);

    return match
        ? { html: match[0], rest: html.replace(pattern, "") }
        : { html: "", rest: html };
}

export class AiSidebarGroupController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.expanded = false;
    }

    start() {
        if (this.started) return;
        this.started = true;
        this.wrapSidebarRender();
        this.wrapAppRender();
        this.apply();
    }

    wrapSidebarRender() {
        const sidebar = this.app?.mainView?.sidebar;
        if (!sidebar?.render) return;
        const originalRender = sidebar.render.bind(sidebar);

        sidebar.render = (...args) => {
            let html = originalRender(...args);
            const tools = [];

            for (const id of AI_SIDEBAR_TOOL_IDS) {
                const extracted = extractButton(html, id);
                html = extracted.rest;
                if (extracted.html) tools.push(extracted.html.trim());
            }

            if (!tools.length || html.includes('id="aiSidebarTools"')) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const group = `

                    <details
                        id="aiSidebarTools"
                        class="aiSidebarTools"
                        ${this.expanded ? "open" : ""}>
                        <summary class="aiSidebarToolsSummary">
                            <span>Asistencia con IA</span>
                            <span
                                class="aiSidebarToolsChevron"
                                aria-hidden="true">›</span>
                        </summary>
                        <div class="aiSidebarToolsBody">
                            ${tools.join("\n                            ")}
                        </div>
                    </details>`;

            return html.replace(marker, `${marker}${group}`);
        };
    }

    wrapAppRender() {
        if (!this.app?.render) return;
        const originalRender = this.app.render.bind(this.app);

        this.app.render = (...args) => {
            const result = originalRender(...args);
            this.apply();
            return result;
        };
    }

    apply() {
        const group = this.document?.getElementById?.(
            "aiSidebarTools"
        );
        if (!group || group.dataset.aiSidebarBound) return;

        group.dataset.aiSidebarBound = "true";
        group.addEventListener("toggle", () => {
            this.expanded = Boolean(group.open);
        });
    }
}
