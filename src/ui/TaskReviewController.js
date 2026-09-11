import {
    buildTaskReviewSignals
} from "../core/TaskReviewSignals.js";
import {
    getLocalDateIso
} from "../core/AiTaskContext.js";
import { escapeHtml } from "./escapeHtml.js";

function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0
        ? parsed
        : fallback;
}

export class TaskReviewController {
    constructor(app, { documentRef = globalThis.document } = {}) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
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
            const html = originalRender(...args);
            if (html.includes('id="openTaskReview"')) return html;

            const buttonMarkup = `\n                            <button id="openTaskReview" type="button" class="sidebarButton" aria-haspopup="dialog">Revisión de tareas</button>`;
            const whatDoNowMarker = /(<button\b[^>]*id=["']openWhatDoNow["'][^>]*>)/i;
            const statisticsMarker = /(<button\b[^>]*id=["']showStatistics["'][^>]*>)/i;

            if (whatDoNowMarker.test(html)) {
                return html.replace(
                    whatDoNowMarker,
                    `${buttonMarkup}\n                            $1`
                );
            }

            if (statisticsMarker.test(html)) {
                return html.replace(
                    statisticsMarker,
                    `${buttonMarkup}\n                            $1`
                );
            }

            const groupedMarker = /(<div\b[^>]*class=["'][^"']*\bsidebarPlanningGroupBody\b[^"']*["'][^>]*>)/i;
            return groupedMarker.test(html)
                ? html.replace(groupedMarker, `$1${buttonMarkup}`)
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

        const button = this.document?.getElementById?.("openTaskReview");
        const whatDoNow = this.document?.getElementById?.("openWhatDoNow");
        const statistics = this.document?.getElementById?.("showStatistics");
        const anchor = whatDoNow || statistics;

        if (
            button &&
            anchor &&
            button.parentElement === anchor.parentElement &&
            button.nextElementSibling !== anchor
        ) {
            anchor.before(button);
        }

        if (!button || button.dataset.taskReviewBound) return;
        button.dataset.taskReviewBound = "true";
        button.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById?.("taskReviewDialog")
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "taskReviewDialog";
        dialog.className = "settingsDialog taskReviewDialog";
        dialog.setAttribute("aria-labelledby", "taskReviewTitle");
        this.document.body.appendChild(dialog);
    }

    getConfig() {
        return this.app.taskReviewPreferences?.get?.() || {};
    }

    getReviewItems() {
        const tasks = this.app.taskService?.getAllTasks?.() || [];
        const signals = buildTaskReviewSignals({
            tasks,
            today: getLocalDateIso(),
            config: this.getConfig()
        });
        const taskById = new Map(
            tasks.map(task => [task.id, task])
        );
        const grouped = new Map();

        for (const signal of signals) {
            if (!grouped.has(signal.taskId)) {
                grouped.set(signal.taskId, []);
            }
            grouped.get(signal.taskId).push(signal);
        }

        return [...grouped.entries()]
            .map(([taskId, taskSignals]) => ({
                taskId,
                title: taskById.get(taskId)?.title || "Tarea sin título",
                signals: taskSignals
            }))
            .sort((a, b) => {
                if (b.signals.length !== a.signals.length) {
                    return b.signals.length - a.signals.length;
                }
                return a.title.localeCompare(b.title, "es");
            });
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document.getElementById("taskReviewDialog");
        if (dialog && !dialog.open && typeof dialog.showModal === "function") {
            dialog.showModal();
        }
    }

    close() {
        const dialog = this.document.getElementById("taskReviewDialog");
        if (dialog?.open && typeof dialog.close === "function") {
            dialog.close();
        }
    }

    saveFromDialog() {
        const config = this.getConfig();
        const value = {
            staleUnscheduled: {
                enabled: Boolean(
                    this.document.getElementById("reviewStaleEnabled")?.checked
                ),
                days: positiveInteger(
                    this.document.getElementById("reviewStaleDays")?.value,
                    config.staleUnscheduled?.days || 30
                )
            },
            overdue: {
                enabled: Boolean(
                    this.document.getElementById("reviewOverdueEnabled")?.checked
                ),
                days: positiveInteger(
                    this.document.getElementById("reviewOverdueDays")?.value,
                    config.overdue?.days || 1
                )
            },
            repeatedPostponements: {
                enabled: Boolean(
                    this.document.getElementById("reviewPostponedEnabled")?.checked
                ),
                count: positiveInteger(
                    this.document.getElementById("reviewPostponedCount")?.value,
                    config.repeatedPostponements?.count || 3
                )
            },
            unplannedProcessed: {
                enabled: Boolean(
                    this.document.getElementById("reviewUnplannedEnabled")?.checked
                )
            }
        };

        this.app.taskReviewPreferences?.save?.(value);
        this.renderDialog("Preferencias guardadas.");
    }

    renderDialog(statusMessage = "") {
        const dialog = this.document.getElementById("taskReviewDialog");
        if (!dialog) return;

        const config = this.getConfig();
        const items = this.getReviewItems();
        const results = items.length
            ? items.map(item => `
                <article class="taskReviewItem">
                    <h3>${escapeHtml(item.title)}</h3>
                    <ul>
                        ${item.signals.map(signal => `
                            <li>${escapeHtml(signal.label)}</li>
                        `).join("")}
                    </ul>
                </article>`).join("")
            : `<p class="settingsHint">No hay tareas que coincidan con las reglas activas.</p>`;

        dialog.innerHTML = `
            <style>
                .taskReviewDialog { width:min(760px, calc(100vw - 32px)); }
                .taskReviewIntro { margin-top:0; }
                .taskReviewRules { display:grid; gap:10px; margin:14px 0 18px; }
                .taskReviewRule { padding:10px 12px; border:1px solid var(--color-border); border-radius:8px; background:var(--color-surface); }
                .taskReviewRuleMain { display:flex; align-items:center; gap:8px; font-weight:600; }
                .taskReviewThreshold { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin:8px 0 0 24px; }
                .taskReviewThreshold input { width:72px; }
                .taskReviewResultsHeader { margin:18px 0 8px; }
                .taskReviewList { display:flex; flex-direction:column; gap:8px; }
                .taskReviewItem { padding:10px 12px; border:1px solid var(--color-border); border-radius:8px; background:var(--color-surface); }
                .taskReviewItem h3 { margin:0 0 5px; font-size:1rem; }
                .taskReviewItem ul { margin:0; padding-left:20px; }
                .taskReviewSaveStatus { margin:8px 0 0; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="taskReviewTitle">Revisión de tareas</h2>
                <button id="closeTaskReview" type="button" class="iconButton" aria-label="Cerrar" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">
                <p class="settingsHint taskReviewIntro">Las reglas solo detectan situaciones que conviene revisar. No modifican, completan, posponen ni reprograman tareas automáticamente.</p>
                <form id="taskReviewRulesForm">
                    <div class="taskReviewRules">
                        <div class="taskReviewRule">
                            <label class="taskReviewRuleMain">
                                <input id="reviewOverdueEnabled" type="checkbox" ${config.overdue?.enabled ? "checked" : ""}>
                                <span>Vencidas que siguen pendientes</span>
                            </label>
                            <label class="taskReviewThreshold" for="reviewOverdueDays">
                                Avisar desde
                                <input id="reviewOverdueDays" type="number" min="1" max="3650" value="${config.overdue?.days || 1}">
                                día(s) de atraso
                            </label>
                        </div>
                        <div class="taskReviewRule">
                            <label class="taskReviewRuleMain">
                                <input id="reviewStaleEnabled" type="checkbox" ${config.staleUnscheduled?.enabled ? "checked" : ""}>
                                <span>Sin fecha y sin cambios durante mucho tiempo</span>
                            </label>
                            <label class="taskReviewThreshold" for="reviewStaleDays">
                                Avisar después de
                                <input id="reviewStaleDays" type="number" min="1" max="3650" value="${config.staleUnscheduled?.days || 30}">
                                día(s)
                            </label>
                        </div>
                        <div class="taskReviewRule">
                            <label class="taskReviewRuleMain">
                                <input id="reviewPostponedEnabled" type="checkbox" ${config.repeatedPostponements?.enabled ? "checked" : ""}>
                                <span>Pospuestas reiteradamente</span>
                            </label>
                            <label class="taskReviewThreshold" for="reviewPostponedCount">
                                Avisar desde
                                <input id="reviewPostponedCount" type="number" min="1" max="100" value="${config.repeatedPostponements?.count || 3}">
                                posposición(es)
                            </label>
                        </div>
                        <div class="taskReviewRule">
                            <label class="taskReviewRuleMain">
                                <input id="reviewUnplannedEnabled" type="checkbox" ${config.unplannedProcessed?.enabled ? "checked" : ""}>
                                <span>Procesadas sin fecha ni proyecto</span>
                            </label>
                        </div>
                    </div>
                    <button type="submit" class="primaryAction">Guardar reglas</button>
                    ${statusMessage
                        ? `<p class="settingsSaveStatus taskReviewSaveStatus" role="status">${escapeHtml(statusMessage)}</p>`
                        : ""}
                </form>
                <h3 class="taskReviewResultsHeader">Para revisar (${items.length})</h3>
                <div class="taskReviewList">${results}</div>
            </div>
            <div class="settingsDialogFooter">
                <button id="cancelTaskReview" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.document.getElementById("closeTaskReview")?.addEventListener("click", () => this.close());
        this.document.getElementById("cancelTaskReview")?.addEventListener("click", () => this.close());
        this.document.getElementById("taskReviewRulesForm")?.addEventListener("submit", event => {
            event.preventDefault();
            this.saveFromDialog();
        });
    }
}
