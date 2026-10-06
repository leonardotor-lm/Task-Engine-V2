import { escapeHtml as e } from "./escapeHtml.js";
import { ProcessStatus, ProgressType, localProcessStartDate } from "../domain/Process.js";

export const processStatusLabels = { ACTIVE: "En curso", PAUSED: "Pausado", COMPLETED: "Completado", ARCHIVED: "Archivado" };
const typeLabels = { NONE: "Sin medición", PERCENTAGE: "Porcentaje", QUANTITY: "Cantidad" };
const options = (labels, value) => Object.entries(labels).map(([key, label]) => `<option value="${key}" ${key === value ? "selected" : ""}>${label}</option>`).join("");

export function renderProcessProgress(process) {
    if (process.progressType === ProgressType.NONE) return "";
    const value = process.currentValue;
    const total = process.targetValue;
    const label = process.progressType === ProgressType.PERCENTAGE ? `${value} %` : `${value} / ${total} ${process.unit}`;
    return `<span>${e(label)}</span><progress value="${value}" max="${total}" aria-label="${e(label)}"></progress>`;
}

export function renderProcessCard(process) {
    return `<article class="processCard">
        <button type="button" data-open-process="${e(process.id)}" class="processTitle">${e(process.title)}</button>
        <span>${processStatusLabels[process.status]}</span>
        ${renderProcessProgress(process)}
        <small>${process.lastProgressAt ? `Último avance: ${e(new Date(process.lastProgressAt).toLocaleDateString("es-AR"))}` : "Sin avances registrados"}</small>
    </article>`;
}

export class ProcessView {
    render(state) {
        const processes = state.processes ?? [];
        const process = processes.find(item => item.id === state.selectedProcessId);
        const editing = state.processEditing;
        const editor = editing ? this.editor(process, state) : "";
        if (!process) return `<main class="content processWorkspace">
            <div class="processHeading"><h2>Procesos</h2><button type="button" data-process-action="create" class="primaryAction">Nuevo proceso</button></div>
            <label>Mostrar <select id="processStatusFilter"><option value="ALL" ${state.processStatusFilter === "ALL" ? "selected" : ""}>Todos</option>${options(processStatusLabels, state.processStatusFilter ?? "ACTIVE")}</select></label>
            ${editor}
            <div class="processCards">${processes.filter(item => state.processStatusFilter === "ALL" || item.status === (state.processStatusFilter ?? "ACTIVE")).map(renderProcessCard).join("") || '<p class="emptyState">No hay procesos en este estado.</p>'}</div>
        </main>`;
        const goal = state.goals.find(item => item.id === process.objectiveId);
        const tasks = (state.allTasks ?? []).filter(task => process.taskIds.includes(task.id));
        const entries = (state.processEntries ?? []).filter(entry => entry.processId === process.id)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
        return `<main class="content processWorkspace">
            <nav class="processHeading"><button type="button" data-process-action="back">Procesos</button>${goal ? `<button type="button" data-process-goal="${e(goal.id)}">${e(goal.title)}</button>` : ""}</nav>
            <div class="processHeading"><h2>${e(process.title)}</h2><button type="button" data-process-action="edit">Editar proceso</button></div>
            <p>${processStatusLabels[process.status]} · Inicio: ${e(process.startedAt)}</p>
            ${renderProcessProgress(process)}
            ${process.notes ? `<p class="processNotes">${e(process.notes)}</p>` : ""}
            ${process.nextStep ? `<p><strong>Próximo paso:</strong> ${e(process.nextStep)}</p>` : ""}
            ${editor}
            ${!editing && process.status === ProcessStatus.ACTIVE ? `<section><h3>Registrar avance</h3><form id="processProgressForm" data-process-id="${e(process.id)}" class="processForm">
                ${process.progressType !== ProgressType.NONE ? `<label>${process.progressType === ProgressType.PERCENTAGE ? "Porcentaje alcanzado" : `Cantidad alcanzada (${e(process.unit)})`}<input name="value" type="number" min="0" max="${process.targetValue}" step="any" value="${process.currentValue}" required></label>` : ""}
                <label>Nota breve<textarea name="note" ${process.progressType === ProgressType.NONE ? "required" : ""}></textarea></label>
                <button type="submit" class="primaryAction">Registrar avance</button><p class="processError" role="alert"></p>
            </form></section>` : ""}
            <section><h3>Tareas y proyectos vinculados</h3>${tasks.length ? `<ul>${tasks.map(task => `<li><button type="button" data-process-task="${e(task.id)}">${e(task.title)}</button>${task.isCompleted() ? " · Completada" : ""}</li>`).join("")}</ul>` : "<p>Sin tareas vinculadas. Podés asociarlas al editar el proceso.</p>"}</section>
            <section><h3>Historial de avances</h3>${entries.length ? `<ol class="processHistory">${entries.map(entry => `<li><time datetime="${e(entry.createdAt)}">${e(new Date(entry.createdAt).toLocaleString("es-AR"))}</time>${entry.progressType !== ProgressType.NONE ? `<strong>${entry.value}${entry.progressType === ProgressType.PERCENTAGE ? " %" : ` ${e(entry.unit)}`}</strong>` : ""}<p class="processNotes">${e(entry.note)}</p></li>`).join("")}</ol>` : "<p>Todavía no registraste avances.</p>"}</section>
        </main>`;
    }

    editor(process, state) {
        const p = process ?? { title: "", notes: "", nextStep: "", status: "ACTIVE", progressType: "NONE", currentValue: 0, targetValue: "", unit: "", taskIds: [], startedAt: localProcessStartDate() };
        return `<form id="processEditorForm" data-process-id="${e(process?.id ?? "")}" class="processForm">
            <label>Título<input name="title" value="${e(p.title)}" required></label>
            <label>Objetivo<select name="objectiveId" aria-label="Objetivo"><option value="">Sin objetivo asociado</option>${state.goals.filter(goal => goal.status !== "DELETED").map(goal => `<option value="${e(goal.id)}" ${goal.id === p.objectiveId ? "selected" : ""}>${e(goal.title)}</option>`).join("")}</select></label>
            <label>Estado<select name="status" aria-label="Estado">${options(processStatusLabels, p.status)}</select></label>
            <label>Medición<select name="progressType" aria-label="Medición">${options(typeLabels, p.progressType)}</select></label>
            <div data-process-quantity ${p.progressType === "NONE" ? "hidden" : ""}>
                ${!process ? `<label>Avance inicial<input name="currentValue" type="number" min="0" step="any" value="${p.currentValue}"></label>` : ""}
                <label data-process-total ${p.progressType !== "QUANTITY" ? "hidden" : ""}>Cantidad total<input name="targetValue" type="number" min="0.000001" step="any" value="${p.targetValue ?? ""}"></label>
                <label data-process-unit ${p.progressType !== "QUANTITY" ? "hidden" : ""}>Unidad<input name="unit" placeholder="páginas, capítulos, clases…" value="${e(p.unit)}"></label>
            </div>
            <label>Fecha de inicio<input name="startedAt" type="date" value="${e(p.startedAt)}" required></label>
            <label>Próximo paso<input name="nextStep" value="${e(p.nextStep)}"></label>
            <label>Notas breves<textarea name="notes">${e(p.notes)}</textarea></label>
            <details><summary>Tareas y proyectos vinculados</summary><input type="search" id="processTaskSearch" placeholder="Buscar tareas o proyectos" aria-label="Buscar tareas o proyectos"><div class="processTaskChoices">${(state.allTasks ?? []).filter(task => !task.isDeleted()).map(task => `<label data-process-task-choice><input name="taskIds" type="checkbox" value="${e(task.id)}" ${p.taskIds.includes(task.id) ? "checked" : ""}>${e(task.title)}</label>`).join("")}</div></details>
            <div class="processHeading"><button type="submit" class="primaryAction">Guardar</button><button type="button" data-process-action="cancel">Cancelar</button></div>
            <p class="processError" role="alert"></p>
        </form>`;
    }
}
