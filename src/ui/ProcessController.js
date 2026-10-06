import { View } from "../core/View.js";

export class ProcessController {
    constructor(app) { this.app = app; }
    start() {
        const view = this.app.mainView;
        view.callbacks.onShowProcesses = () => {
            this.discardDraftOnce = true;
            this.app.selectedProcessId = null;
            this.app.processEditing = false;
            this.app.navigateTo(View.PROCESSES);
            this.app.mainView.closeMobileMenu();
        };
        const render = view.render.bind(view);
        view.render = state => {
            const draft = !this.discardDraftOnce ? this.captureDraft() : null;
            this.discardDraftOnce = false;
            render(state);
            this.bind();
            if (draft && state.view === View.PROCESSES && state.selectedProcessId === draft.processId) this.restoreDraft(draft);
        };
    }
    captureDraft() {
        const form = document.getElementById("processEditorForm") ?? document.getElementById("processProgressForm");
        if (!form) return null;
        return { formId: form.id, processId: form.dataset.processId || null, fields: [...new FormData(form)] };
    }
    restoreDraft(draft) {
        const form = document.getElementById(draft.formId);
        if (!form) return;
        for (const control of form.elements) {
            if (!control.name) continue;
            const values = draft.fields.filter(([name]) => name === control.name).map(([, value]) => value);
            if (control.type === "checkbox") control.checked = values.includes(control.value);
            else control.value = values[0] ?? "";
        }
        form.elements.progressType?.dispatchEvent(new Event("change"));
    }
    bind() {
        const app = this.app;
        document.querySelectorAll("[data-open-process]").forEach(button => button.addEventListener("click", () => {
            this.discardDraftOnce = true;
            app.selectedProcessId = button.dataset.openProcess;
            app.processEditing = false;
            app.navigateTo(View.PROCESSES);
            app.mainView.closeMobileMenu();
        }));
        document.querySelectorAll("[data-process-goal]").forEach(button => button.addEventListener("click", () => app.mainView.callbacks.onSelectGoal(button.dataset.processGoal)));
        document.querySelectorAll("[data-process-task]").forEach(button => button.addEventListener("click", () => {
            const id = button.dataset.processTask;
            const task = app.taskService.getTaskById(id);
            if (task && (task.isProject || app.taskService.getProjectDescendants(id).length > 0)) {
                app.mainView.callbacks.onOpenProject(id);
            } else {
                app.mainView.callbacks.onSelectTask(id);
            }
        }));
        document.querySelectorAll("[data-process-action]").forEach(button => button.addEventListener("click", () => {
            this.discardDraftOnce = true;
            const action = button.dataset.processAction;
            if (action === "back" || action === "create") app.selectedProcessId = null;
            app.processEditing = action === "create" || action === "edit";
            app.render();
        }));
        document.getElementById("processStatusFilter")?.addEventListener("change", event => {
            app.processStatusFilter = event.target.value;
            app.render();
        });
        const editor = document.getElementById("processEditorForm");
        editor?.elements.progressType.addEventListener("change", event => {
            const type = event.target.value;
            editor.querySelector("[data-process-quantity]").hidden = type === "NONE";
            editor.querySelector("[data-process-total]").hidden = type !== "QUANTITY";
            editor.querySelector("[data-process-unit]").hidden = type !== "QUANTITY";
        });
        document.getElementById("processTaskSearch")?.addEventListener("input", event => {
            const query = event.target.value.toLocaleLowerCase("es");
            editor.querySelectorAll("[data-process-task-choice]").forEach(label => { label.hidden = !label.textContent.toLocaleLowerCase("es").includes(query); });
        });
        editor?.addEventListener("submit", event => {
            event.preventDefault();
            this.save(editor, () => {
                const form = new FormData(editor);
                const type = form.get("progressType");
                const data = { title: form.get("title"), objectiveId: form.get("objectiveId") || null,
                    status: form.get("status"), progressType: type, targetValue: type === "QUANTITY" ? Number(form.get("targetValue")) : type === "PERCENTAGE" ? 100 : null,
                    unit: form.get("unit"), notes: form.get("notes"), nextStep: form.get("nextStep"), startedAt: form.get("startedAt"), taskIds: form.getAll("taskIds") };
                const process = app.selectedProcessId ? app.processService.updateProcess(app.selectedProcessId, data)
                    : app.processService.createProcess({ ...data, currentValue: Number(form.get("currentValue") ?? 0) });
                app.selectedProcessId = process.id;
                app.processEditing = false;
            });
        });
        const progress = document.getElementById("processProgressForm");
        progress?.addEventListener("submit", event => {
            event.preventDefault();
            this.save(progress, () => {
                const form = new FormData(progress);
                app.processService.recordProgress(app.selectedProcessId, { value: form.has("value") ? Number(form.get("value")) : null, note: form.get("note") });
            });
        });
    }
    save(form, action) {
        try { action(); this.discardDraftOnce = true; this.app.render(); }
        catch (error) { form.querySelector(".processError").textContent = error.message; }
    }
}
