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
        `\\n\\s*<button\\b(?=[^>]*id=["']${id}["'])[^>]*>[\\s\\S]*?<\\/button>`,
        "i"
    );
    const match = html.match(pattern);

    return match
        ? { html: match[0], rest: html.replace(pattern, "") }
        : { html: "", rest: html };
}

function insertAfterStatistics(html, group) {
    const pattern = /(<button\b(?=[^>]*id=["']showStatistics["'])[^>]*>[\s\S]*?<\/button>)/i;

    if (pattern.test(html)) {
        return html.replace(pattern, `$1${group}`);
    }

    const planningPattern = /(<span\b[^>]*class=["'][^"']*\bsidebarSectionLabel\b[^"']*["'][^>]*>\s*Planificación\s*<\/span>)/i;

    return planningPattern.test(html)
        ? html.replace(planningPattern, `$1${group}`)
        : null;
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
        this.ensureStyles();
        this.wrapSidebarRender();
        this.wrapAppRender();
        this.apply();
    }

    ensureStyles() {
        if (
            !this.document?.head ||
            this.document.getElementById?.("aiSidebarGroupStyles")
        ) {
            return;
        }

        const style = this.document.createElement("style");
        style.id = "aiSidebarGroupStyles";
        style.textContent = `
            .sidebarSectionLabel,
            .customFiltersSection > summary,
            .sidebarNavigationGroup > summary,
            .aiSidebarTools > summary {
                box-sizing: border-box;
                min-height: 30px;
                padding: 6px 8px 4px;
                color: var(--color-text-muted);
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
            }
            .customFiltersSection,
            .sidebarNavigationGroup,
            .aiSidebarTools {
                margin: 4px 0 0;
                padding: 0;
                border: 0;
            }
            .customFiltersSection > summary,
            .sidebarNavigationGroup > summary,
            .aiSidebarTools > summary {
                display: flex;
                align-items: center;
                gap: 8px;
                border-radius: 6px;
                cursor: pointer;
                list-style: none;
                user-select: none;
            }
            .customFiltersSection > summary::-webkit-details-marker,
            .sidebarNavigationGroup > summary::-webkit-details-marker,
            .aiSidebarTools > summary::-webkit-details-marker {
                display: none;
            }
            .customFiltersSection > summary::after,
            .sidebarNavigationGroup > summary::after,
            .aiSidebarTools > summary::after {
                content: "›";
                margin-left: auto;
                font-size: 14px;
                font-weight: 400;
                line-height: 1;
                transition: transform 120ms ease;
            }
            .customFiltersSection[open] > summary::after,
            .sidebarNavigationGroup[open] > summary::after,
            .aiSidebarTools[open] > summary::after {
                transform: rotate(90deg);
            }
            .customFiltersSection > summary:hover,
            .sidebarNavigationGroup > summary:hover,
            .aiSidebarTools > summary:hover {
                background: var(--color-surface-hover);
            }
            .customFiltersSection {
                padding-bottom: 0;
                border-bottom: 0;
            }
            .sidebarListControls {
                margin: 0;
                padding-bottom: 0;
                border-bottom: 0;
            }
            .aiSidebarToolsBody {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 2px 0 2px 10px;
            }
            .aiSidebarToolsBody .sidebarButton {
                width: 100%;
            }
            @media (max-width: 760px) {
                .sidebarSectionLabel,
                .customFiltersSection > summary,
                .sidebarNavigationGroup > summary,
                .aiSidebarTools > summary {
                    font-size: 13px;
                    letter-spacing: 0.03em;
                }
            }
        `;
        this.document.head.appendChild(style);
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

            const group = `

                    <details
                        id="aiSidebarTools"
                        class="aiSidebarTools sidebarNavigationGroup"${this.expanded ? " open" : ""}>
                        <summary>Asistencia con IA</summary>
                        <div class="aiSidebarToolsBody sidebarNavigationGroupBody">
                            ${tools.join("\n                            ")}
                        </div>
                    </details>`;

            const groupedHtml = insertAfterStatistics(
                html,
                group
            );

            return groupedHtml ?? html;
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

        this.document?.querySelectorAll?.(
            ".sidebarListControls"
        )?.forEach(section => {
            const hasContent = Boolean(
                section.querySelector?.(
                    "button, input, select, details, form, a"
                )
            );
            section.hidden = !hasContent;
        });

        if (!group || group.dataset.aiSidebarBound) return;

        group.dataset.aiSidebarBound = "true";
        group.addEventListener("toggle", () => {
            this.expanded = Boolean(group.open);
        });
    }
}
