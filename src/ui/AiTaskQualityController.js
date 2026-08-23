import {
    buildAiTaskContext
} from "../core/AiTaskContext.js";
import { escapeHtml } from "./escapeHtml.js";
import {
    assertAiStructuredResponseComplete,
    requireAiStructuredCollection
} from "../core/AiStructuredResponse.js";

const QUALITY_TYPES = Object.freeze({
    DUPLICATE: "Posible duplicado",
    AMBIGUOUS: "Título ambiguo",
    TOO_LARGE: "Posible proyecto",
    UNORGANIZED: "Falta de organización"
});

const ACTIVE_STATUSES = new Set([
    "INBOX",
    "PENDING"
]);

export const TASK_QUALITY_QUESTION = [
    "Auditá las tareas activas y señalá sólo problemas claros.",
    "Tipos: DUPLICATE, AMBIGUOUS, TOO_LARGE, UNORGANIZED.",
    "DUPLICATE: 2 a 4 tareas que representan esencialmente la misma acción o resultado; no sólo tareas relacionadas.",
    "AMBIGUOUS: título demasiado vago para identificar la acción.",
    "TOO_LARGE: tarea no proyecto que claramente requiere varias acciones; sé conservador.",
    "UNORGANIZED: falta relevante de área, contexto o etiquetas cuando serían claramente útiles; no uses sólo ausencia de fecha o prioridad.",
    "No inventes datos. Para DUPLICATE usá 2 a 4 taskIds; para los demás, exactamente 1.",
    'Respondé sólo JSON: {"findings":[{"type":"AMBIGUOUS","taskIds":["id"],"reason":"motivo breve","recommendation":"sugerencia concreta"}]}.',
    'Copiá exactamente los taskIds recibidos. Si no hay hallazgos, devolvé {"findings":[]}.'
].join("\n");

function normalizeText(value, maxLength = 360) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

function normalizeTaskIds(value) {
    return [
        ...new Set(
            (Array.isArray(value) ? value : [value])
                .map(id => String(id || "").trim())
                .filter(Boolean)
        )
    ];
}

export function parseTaskQualityFindings(answer, tasks) {
    const text = String(answer || "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace < firstBrace) {
        throw new Error(
            "La IA devolvió un diagnóstico con formato inválido. Intentá nuevamente."
        );
    }

    let parsed;
    try {
        parsed = JSON.parse(
            text.slice(firstBrace, lastBrace + 1)
        );
    } catch {
        throw new Error(
            "La IA devolvió un diagnóstico con formato inválido. Intentá nuevamente."
        );
    }

    const tasksById = new Map(
        (tasks || []).map(task => [
            String(task?.id || ""),
            task
        ])
    );
    const findings = requireAiStructuredCollection(
        parsed,
        "findings",
        { kind: "un diagnóstico" }
    );
    const seen = new Set();

    return findings
        .map(item => {
            const type = String(item?.type || "")
                .trim()
                .toUpperCase();
            const taskIds = normalizeTaskIds(
                item?.taskIds ?? item?.taskId
            );

            if (!QUALITY_TYPES[type]) return null;
            if (
                type === "DUPLICATE"
                    ? taskIds.length < 2 || taskIds.length > 4
                    : taskIds.length !== 1
            ) {
                return null;
            }

            const relatedTasks = taskIds
                .map(id => tasksById.get(id));
            if (
                relatedTasks.some(task =>
                    !task ||
                    !ACTIVE_STATUSES.has(task.status)
                )
            ) {
                return null;
            }

            if (
                type === "TOO_LARGE" &&
                relatedTasks[0]?.isProject
            ) {
                return null;
            }

            const key = `${type}:${[...taskIds].sort().join("|")}`;
            if (seen.has(key)) return null;
            seen.add(key);

            const reason = normalizeText(item?.reason);
            const recommendation = normalizeText(
                item?.recommendation
            );

            if (!reason || !recommendation) return null;

            return {
                type,
                label: QUALITY_TYPES[type],
                taskIds,
                reason,
                recommendation
            };
        })
        .filter(Boolean);
}

export class AiTaskQualityController {

    constructor(
        app,
        { documentRef = globalThis.document } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
        this.loading = false;
        this.error = "";
        this.report = null;
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
            if (html.includes('id="openAiTaskQuality"')) {
                return html;
            }

            const marker = `
                    <span class="sidebarSectionLabel">
                        Planificación
                    </span>`;

            if (!html.includes(marker)) return html;

            const entry = `

                    <button
                        id="openAiTaskQuality"
                        type="button"
                        class="sidebarButton"
                        aria-haspopup="dialog">
                        Revisar calidad
                    </button>`;

            return html.replace(marker, `${marker}${entry}`);
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
        this.bindSidebarEntry();
        this.ensureDialog();
    }

    bindSidebarEntry() {
        const entry = this.document?.getElementById?.(
            "openAiTaskQuality"
        );
        if (!entry || entry.dataset.aiQualityBound) return;

        entry.dataset.aiQualityBound = "true";
        entry.addEventListener("click", () => this.open());
    }

    ensureDialog() {
        if (
            !this.document?.body ||
            this.document.getElementById?.(
                "aiTaskQualityDialog"
            )
        ) {
            return;
        }

        const dialog = this.document.createElement("dialog");
        dialog.id = "aiTaskQualityDialog";
        dialog.className =
            "settingsDialog aiTaskQualityDialog";
        dialog.setAttribute(
            "aria-labelledby",
            "aiTaskQualityTitle"
        );
        this.document.body.appendChild(dialog);
    }

    open() {
        this.ensureDialog();
        this.renderDialog();
        const dialog = this.document?.getElementById?.(
            "aiTaskQualityDialog"
        );
        if (
            dialog &&
            !dialog.open &&
            typeof dialog.showModal === "function"
        ) {
            dialog.showModal();
        }
    }

    close() {
        const dialog = this.document?.getElementById?.(
            "aiTaskQualityDialog"
        );
        if (dialog?.open && typeof dialog.close === "function") {
            dialog.close();
        }
    }

    isEnabled() {
        return Boolean(
            this.app?.aiPreferences?.isEnabled?.()
        );
    }

    getEligibleTasks() {
        return (
            this.app?.taskService?.getAllTasks?.() || []
        ).filter(task =>
            ACTIVE_STATUSES.has(task.status)
        );
    }

    buildContext() {
        const eligibleTasks = this.getEligibleTasks();
        const base = buildAiTaskContext({
            tasks: eligibleTasks,
            areas:
                this.app.areaService?.getAllAreas?.() || [],
            contexts:
                this.app.contextService?.getAllContexts?.() || [],
            tags:
                this.app.tagService?.getAllTags?.() || [],
            question:
                "Auditar calidad y organización de tareas activas",
            includeTaskIds: true
        });

        const eligibleById = new Map(
            eligibleTasks.map(task => [String(task.id), task])
        );

        return {
            ...base,
            requestType: "taskQualityAudit",
            tasks: base.tasks.map(task => {
                const source = eligibleById.get(String(task.taskId));
                return {
                    ...task,
                    areaId: source?.areaId ?? null,
                    contextId: source?.contextId ?? null,
                    tagIds: [...(source?.tagIds || [])],
                    isProject: source?.isProject === true,
                    parentTaskId: source?.parentTaskId ?? null
                };
            }),
            aiProvider:
                this.app?.aiPreferences?.getProvider?.() ||
                "gemini",
            aiModel:
                this.app?.aiPreferences?.getModel?.() ||
                "gemini-3.7-flash"
        };
    }

    renderDialog() {
        const dialog = this.document?.getElementById?.(
            "aiTaskQualityDialog"
        );
        if (!dialog) return;

        dialog.innerHTML = `
            <style>
                .aiTaskQualityDialog { width:min(800px, calc(100vw - 32px)); }
                .aiTaskQualityList { display:flex; flex-direction:column; gap:12px; margin-top:12px; }
                .aiTaskQualityItem { padding:12px; border:1px solid var(--border-color, #d8d8d8); border-radius:8px; }
                .aiTaskQualityType { font-weight:700; }
                .aiTaskQualityTasks { margin:4px 0 8px; font-weight:600; }
                .aiTaskQualityItem p { margin:6px 0; line-height:1.45; }
                .aiTaskQualityActions { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
            </style>
            <div class="settingsDialogHeader">
                <h2 id="aiTaskQualityTitle">Revisión de calidad</h2>
                <button id="closeAiTaskQuality" type="button" class="iconButton" aria-label="Cerrar revisión" title="Cerrar">×</button>
            </div>
            <div class="settingsDialogBody">${this.getBodyHtml()}</div>
            <div class="settingsDialogFooter">
                <button id="cancelAiTaskQuality" type="button" class="tertiaryAction">Cerrar</button>
            </div>`;

        this.bindDialogEvents();
    }

    getBodyHtml() {
        if (!this.isEnabled()) {
            return `<p class="settingsHint">Activá la asistencia con IA desde Configuración → IA para revisar la calidad de tus tareas.</p>`;
        }

        const eligibleCount = this.getEligibleTasks().length;

        return `
            <section class="settingsToolPanel">
                <p>La IA busca señales de posibles duplicados, títulos ambiguos, tareas demasiado grandes que aún no son proyectos y tareas poco organizadas. Es un diagnóstico: no modifica ninguna tarea.</p>
                <p class="settingsHint">Se analizan únicamente tareas activas de Inbox y Pendientes. Tareas disponibles: ${eligibleCount}.</p>
                ${this.error ? `<p class="syncErrorHint" role="alert">${escapeHtml(this.error)}</p>` : ""}
                ${this.report ? this.getReportHtml() : ""}
                <div class="aiTaskQualityActions">
                    <button id="generateAiTaskQuality" type="button" class="secondaryAction" ${this.loading || eligibleCount === 0 ? "disabled" : ""}>${this.loading ? "Revisando…" : this.report ? "Revisar nuevamente" : "Revisar calidad"}</button>
                    ${this.report ? '<button id="discardAiTaskQuality" type="button" class="tertiaryAction">Descartar diagnóstico</button>' : ""}
                </div>
            </section>`;
    }

    getReportHtml() {
        const findings = Array.isArray(this.report?.findings)
            ? this.report.findings
            : [];

        if (!findings.length) {
            return `<p class="settingsHint">La IA no encontró problemas de calidad suficientemente claros como para señalarlos.</p>`;
        }

        const tasksById = new Map(
            this.getEligibleTasks().map(task => [
                String(task.id),
                task
            ])
        );
        const html = findings.map(item => {
            const titles = item.taskIds
                .map(id => tasksById.get(id)?.title || "Tarea")
                .map(escapeHtml)
                .join(" · ");

            return `
                <article class="aiTaskQualityItem">
                    <div class="aiTaskQualityType">${escapeHtml(item.label)}</div>
                    <div class="aiTaskQualityTasks">${titles}</div>
                    <p>${escapeHtml(item.reason)}</p>
                    <p><strong>Sugerencia:</strong> ${escapeHtml(item.recommendation)}</p>
                </article>`;
        }).join("");

        return `
            <div class="aiTaskQualityList">${html}</div>
            <p class="settingsHint">${findings.length} ${findings.length === 1 ? "hallazgo" : "hallazgos"}. Revisalos como sugerencias, no como decisiones automáticas.</p>`;
    }

    bindDialogEvents() {
        this.document?.getElementById?.(
            "closeAiTaskQuality"
        )?.addEventListener("click", () => this.close());
        this.document?.getElementById?.(
            "cancelAiTaskQuality"
        )?.addEventListener("click", () => this.close());
        this.document?.getElementById?.(
            "generateAiTaskQuality"
        )?.addEventListener("click", () => this.generate());
        this.document?.getElementById?.(
            "discardAiTaskQuality"
        )?.addEventListener("click", () => {
            this.report = null;
            this.error = "";
            this.renderDialog();
        });
    }

    async generate() {
        if (this.loading || !this.isEnabled()) return null;

        if (!this.app?.syncConfig?.isConfigured?.()) {
            this.error =
                "Configurá primero la conexión con Apps Script.";
            this.renderDialog();
            return null;
        }

        const gateway = this.app.syncEngine?.gateway;
        if (!gateway?.aiQuery) {
            this.error =
                "La instalación actual de Apps Script todavía no admite consultas de IA.";
            this.renderDialog();
            return null;
        }

        const eligibleTasks = this.getEligibleTasks();
        const context = this.buildContext();

        if (!context.tasks.length) {
            this.error = "No hay tareas activas para revisar.";
            this.renderDialog();
            return null;
        }

        this.loading = true;
        this.error = "";
        this.renderDialog();

        try {
            const response = await gateway.aiQuery({
                ...this.app.syncConfig.get(),
                question: TASK_QUALITY_QUESTION,
                context
            });
            assertAiStructuredResponseComplete(
                response,
                { kind: "El diagnóstico de calidad" }
            );
            const findings = parseTaskQualityFindings(
                response.answer,
                eligibleTasks
            );

            this.report = {
                provider: response.provider || "",
                model: response.model || "",
                findings
            };

            return response;
        } catch (error) {
            this.error = String(
                error?.message ||
                error ||
                "No se pudo completar la revisión."
            );
            return null;
        } finally {
            this.loading = false;
            this.renderDialog();
        }
    }
}
