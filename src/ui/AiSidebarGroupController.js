export const AI_SIDEBAR_TOOL_IDS = Object.freeze([
    "openAiAssistant",
    "openAiPriorityProposal",
    "openAiDueDateProposal",
    "openAiWaitingProposal",
    "openAiOrganizationProposal",
    "openAiProjectProposal",
    "openAiTaskQuality"
]);

export const PLANNING_TOOL_IDS = Object.freeze([
    "showAll",
    "showProjects",
    "showGoals",
    "showCalendar",
    "showStatistics"
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

function replacePlanningLabel(html, replacement) {
    const pattern = /<span\b[^>]*class=["'][^"']*\bsidebarSectionLabel\b[^"']*["'][^>]*>\s*Planificación\s*<\/span>/i;

    if (!pattern.test(html)) return null;
    return html.replace(pattern, replacement);
}

function renderChevron() {
    return `
        <svg
            class="sidebarGroupChevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false">
            <path
                d="M5 2.75 L10.25 8 L5 13.25"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round">
            </path>
        </svg>`;
}

function addExplicitChevrons(html) {
    const pattern = /(<details\b[^>]*class=["'][^"']*(?:customFiltersSection|sidebarNavigationGroup)[^"']*["'][^>]*>\s*<summary\b[^>]*>)([\s\S]*?)(<\/summary>)/gi;

    return html.replace(
        pattern,
        (match, start, content, end) => {
            if (/sidebarGroupChevron/.test(content)) {
                return match;
            }

            return `${start}<span class="sidebarGroupLabel">${content.trim()}</span>${renderChevron()}${end}`;
        }
    );
}

export class AiSidebarGroupController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.expanded = false;
        this.planningExpanded = true;
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
            .aiSidebarTools > summary,
            .sidebarPlanningGroup > summary {
                box-sizing: border-box;
                min-height: 30px;
                padding: 6px 8px 4px;
                color: var(--color-text-muted) !important;
                font-family: inherit !important;
                font-size: 11px !important;
                font-weight: 700 !important;
                line-height: 1.3 !important;
                letter-spacing: 0.06em !important;
                text-transform: uppercase !important;
            }
            .customFiltersSection,
            .sidebarNavigationGroup,
            .aiSidebarTools,
            .sidebarPlanningGroup {
                margin: 4px 0 0;
                padding: 0;
            }
            .customFiltersSection,
            .sidebarListControls,
            .aiSidebarTools,
            .sidebarNavigationGroup {
                border: 0 !important;
            }
            .sidebarPlanningGroup {
                margin-top: 8px;
                border: 0 !important;
                border-top: 1px solid var(--color-border) !important;
            }
            .customFiltersSection > summary,
            .sidebarNavigationGroup > summary,
            .aiSidebarTools > summary,
            .sidebarPlanningGroup > summary {
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
            .aiSidebarTools > summary::-webkit-details-marker,
            .sidebarPlanningGroup > summary::-webkit-details-marker {
                display: none;
            }
            .customFiltersSection > summary::after,
            .sidebarNavigationGroup > summary::after,
            .aiSidebarTools > summary::after,
            .sidebarPlanningGroup > summary::after {
                content: none !important;
            }
            .sidebarGroupLabel {
                min-width: 0;
            }
            .sidebarGroupChevron {
                display: block !important;
                flex: 0 0 14px;
                width: 14px !important;
                height: 14px !important;
                margin-left: auto;
                overflow: visible;
                color: currentColor;
                opacity: 1 !important;
                visibility: visible !important;
                transform-origin: center;
                transition: transform 120ms ease;
            }
            .customFiltersSection[open] > summary .sidebarGroupChevron,
            .sidebarNavigationGroup[open] > summary .sidebarGroupChevron,
            .aiSidebarTools[open] > summary .sidebarGroupChevron,
            .sidebarPlanningGroup[open] > summary .sidebarGroupChevron {
                transform: rotate(90deg);
            }
            .customFiltersSection > summary:hover,
            .sidebarNavigationGroup > summary:hover,
            .aiSidebarTools > summary:hover,
            .sidebarPlanningGroup > summary:hover {
                background: var(--color-surface-hover);
            }
            .customFiltersSection {
                padding-bottom: 0 !important;
                border-bottom: 0 !important;
            }
            .sidebarListControls {
                margin: 0;
                padding-bottom: 0 !important;
                border-bottom: 0 !important;
            }
            .sidebarPlanningGroupBody,
            .aiSidebarToolsBody {
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 2px 0 2px 10px;
            }
            .sidebarPlanningGroupBody .sidebarButton,
            .aiSidebarToolsBody .sidebarButton {
                width: 100%;
            }
            @media (max-width: 760px) {
                .sidebarSectionLabel,
                .customFiltersSection > summary,
                .sidebarNavigationGroup > summary,
                .aiSidebarTools > summary,
                .sidebarPlanningGroup > summary {
                    font-size: 13px !important;
                    letter-spacing: 0.03em !important;
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
            let html = addExplicitChevrons(
                originalRender(...args)
            );
            const aiTools = [];
            const planningTools = [];

            for (const id of AI_SIDEBAR_TOOL_IDS) {
                const extracted = extractButton(html, id);
                html = extracted.rest;
                if (extracted.html) aiTools.push(extracted.html.trim());
            }

            for (const id of PLANNING_TOOL_IDS) {
                const extracted = extractButton(html, id);
                html = extracted.rest;
                if (extracted.html) planningTools.push(extracted.html.trim());
            }

            if (!planningTools.length) return html;

            const planningGroup = `
                    <details
                        id="sidebarPlanningGroup"
                        class="sidebarPlanningGroup sidebarNavigationGroup"${this.planningExpanded ? " open" : ""}>
                        <summary>
                            <span class="sidebarGroupLabel">Planificación</span>
                            ${renderChevron()}
                        </summary>
                        <div class="sidebarPlanningGroupBody sidebarNavigationGroupBody">
                            ${planningTools.join("\n                            ")}
                        </div>
                    </details>`;

            const aiGroup = aiTools.length
                ? `

                    <details
                        id="aiSidebarTools"
                        class="aiSidebarTools sidebarNavigationGroup"${this.expanded ? " open" : ""}>
                        <summary>
                            <span class="sidebarGroupLabel">Asistencia con IA</span>
                            ${renderChevron()}
                        </summary>
                        <div class="aiSidebarToolsBody sidebarNavigationGroupBody">
                            ${aiTools.join("\n                            ")}
                        </div>
                    </details>`
                : "";

            const groupedHtml = replacePlanningLabel(
                html,
                `${planningGroup}${aiGroup}`
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
        const aiGroup = this.document?.getElementById?.(
            "aiSidebarTools"
        );
        const planningGroup = this.document?.getElementById?.(
            "sidebarPlanningGroup"
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

        const waiting = this.document?.getElementById?.(
            "showWaiting"
        );
        const statistics = this.document?.getElementById?.(
            "showStatistics"
        );
        if (
            waiting &&
            statistics &&
            waiting.parentElement === statistics.parentElement
        ) {
            statistics.before(waiting);
        }

        if (
            planningGroup &&
            !planningGroup.dataset.aiPlanningBound
        ) {
            planningGroup.dataset.aiPlanningBound = "true";
            planningGroup.addEventListener("toggle", () => {
                this.planningExpanded = Boolean(
                    planningGroup.open
                );
            });
        }

        if (!aiGroup || aiGroup.dataset.aiSidebarBound) return;

        aiGroup.dataset.aiSidebarBound = "true";
        aiGroup.addEventListener("toggle", () => {
            this.expanded = Boolean(aiGroup.open);
        });
    }
}
