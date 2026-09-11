import {
    buildWhatDoNowRecommendations
} from "../core/WhatDoNow.js";
import {
    getLocalDateIso
} from "../core/AiTaskContext.js";
import {
    TaskReviewPreferences
} from "../infrastructure/TaskReviewPreferences.js";
import {
    TaskReviewController
} from "./TaskReviewController.js";
import { escapeHtml } from "./escapeHtml.js";

function renderData(data = {}) {
    const parts = [];

    if (data.dueDate) {
        parts.push(`Vence: ${data.dueDate}${data.dueTime ? ` ${data.dueTime}` : ""}`);
    }
    if (data.context) parts.push(`Contexto: ${data.context}`);
    if (data.area) parts.push(`Área: ${data.area}`);
    if (data.project) parts.push(`Proyecto: ${data.project}`);
    if (data.tags?.length) parts.push(`Etiquetas: ${data.tags.join(", ")}`);
    if (data.goals?.length) parts.push(`Objetivos: ${data.goals.join(", ")}`);
    if (data.recurring) parts.push("Recurrente");

    return parts.length
        ? parts.map(escapeHtml).join(" · ")
        : "Sin otros datos de organización relevantes";
}

export class WhatDoNowController {

    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.started = false;

        if (!this.app.taskReviewPreferences) {
            this.app.taskReviewPreferences = new TaskReviewPreferences();
        }

        this.taskReviewController = new TaskReviewController(
            app,
            { documentRef }
        );
    }

    start() {
        if (this.started) return;
        this.started = true;
        this.wrapSidebarRender();
        this.wrapAppRender();
        this.taskReviewController.start();
        this.apply();
    }

    wrapSidebarRender() {
        const sidebar = this.app?.mainView?.sidebar;
        if (!sidebar?.render) return;
        const originalRender = sidebar.render.bind(sidebar);

        sidebar.render = (...args) => {
            const html = originalRender(...args);
            if (html.includes('id="openWhatDoNow"')) return html;

            const buttonMarkup = `\n                            <button id="openWhatDoNow" type="button" class="sidebarButton" aria-haspopup="dialog">Qué hago ahora</button>`;
            const statisticsMarker = /(<button\b[^>]*id=["']showStatistics["'][^>]*>)/i;

            if (statisticsMarker.test(html)) {
                return html.replace(
                    statisticsMarker,
                    `${buttonMarkup}\n                            $1`
                );
            }

            const groupedMarker = /(<div\b[^>]*class=["'][^"']*\bsidebarPlanningGroupBody\b[^"']*["'][^>]*>)/i;

            if (groupedMarker.test(html)) {
                return html.replace(groupedMarker, `$1${buttonMarkup}`);
            }

            const planningMarker = /(<span\b[^>]*class=["'][^"']*\bsidebarSectionLabel\b[^"']*["'][^>]*>\s*Planificación\s*<\/span>)/i;
            const plainButton = `\n                    <button id="openWhatDoNow" type="button" class="sidebarButton" aria-haspopup="dialog">Qué hago ahora</button>`;

            return planningMarker.test(html)
                ? html.replace(planningMarker, `$1${plainButton}`)
                : html;
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
        this.ensureDialog();
        const button = this.document?.getElementById?.("openWhatDoNow");
        const statistics = this.document?.getElementById?.("showStatistics");

        if (
            button &&
            statistics &&
            button.parentElement === statistics.parentElement &&
            button.nextElementSibling !== statistics
        ) {
            statistics.before(button);
        }

        if (!button || button.dataset.whatDoNowBound) return;

        button.dataset.whatDoNowBound = "true";
        button.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById?.("whatDoNowDialog")
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "whatDoNowDialog";
        dialog.className = "settingsDialog whatDoNowDialog";
        dialog.setAttribute("aria-labelledby", "whatDoNowTitle");
        this.document.body.appendChild(dialog);
    }

    getRecommendations() {
        return buildWhatDoNowRecommendations({
            tasks: this.app.taskService?.getAllTasks?.() || [],
            areas: this.app.areaService?.getAllAreas?.() || [],
            contexts: this.app.contextService?.getAllContexts?.() || [],
            tags: this.app.tagService?.getAllTags?.() || [],
            goals: this.app.goalService?.getAllGoals?.() || [],
            today: getLocalDateIso(),
            limit: 5,
            ruleConfig: this.app.taskReviewPreferences?.get?.() || {}
        });
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document.getElementById("whatDoNowDialog");
        if (dialog && !dialog.open && typeof dialog.showModal === "function") {
            dialog.showModal();
        }
    }

    close() {
        const dialog = this.document.getElementById("whatDoNowDialog");
        if (dialog?.open && typeof dialog.close === "function") {
            dialog.close();
        }
    }

    renderDialog() {
        const dialog = this.document.getElementById("whatDoNowDialog");
        if (!dialog) return;

        const recommendations = this.getRecommendations();
        const content = recommendations.length
            ? recommendations.map((item, index) => `
                <article class="whatDoNowItem">
                    <h3>${index + 1}. ${escapeHtml(item.title)}</h3>
                    <p class="whatDoNowReasons"><strong>Por qué aparece:</strong> ${item.reasons.map(escapeHtml).join(" · ")}</p>
                    <p class="settingsHint"><strong>Datos:</strong> ${renderData(item.data)}</p>
                </article>`).join("")
            : `<p>No hay tareas pendientes disponibles para recomendar ahora.</p>`;

        dialog.innerHTML = `
            <style>
                .whatDoNowDialog { width:min(680px, calc(100vw - 32px)); }
                .whatDoNowIntro { margin-top:0; }
                .whatDoNowList { display:flex; flex-direction:column; gap:10px; }
                .whatDoNowItem { padding:12px; border:1px solid var(--color-border); border-radius:8px; background:var(--color-surface); }
                .whatDoNowItem h3 { margin:0 0 6px; font-size:1rem; }
                .whatDoNowItem p { margin:4px 0 0; line-height:1.4; }
                .whatDoNowReasons { color:var(--color-text); }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="whatDoNowTitle">Qué hago ahora</h2>
                <button id="closeWhatDoNow" type="button" class="iconButton" aria-label="Cerrar" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">
                <p class="settingsHint whatDoNowIntro">Selección local de hasta cinco próximas acciones. Se basa en los datos actuales y no modifica ninguna tarea.</p>
                <div class="whatDoNowList">${content}</div>
            </div>
            <div class="settingsDialogFooter">
                <button id="cancelWhatDoNow" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.document.getElementById("closeWhatDoNow")?.addEventListener("click", () => this.close());
        this.document.getElementById("cancelWhatDoNow")?.addEventListener("click", () => this.close());
    }
}
