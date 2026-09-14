import {
    parseNaturalTaskEntry
} from "../core/NaturalTaskEntryParser.js";
import {
    isTaskCreationDraft,
    isSubtaskCreationDraft
} from "./DirectTaskCreationController.js";
import { Icon } from "./Icon.js";

export class NaturalTaskEntryController {

    constructor(
        app,
        { documentRef = globalThis.document } = {}
    ) {
        this.app = app;
        this.document = documentRef;
        this.started = false;
    }

    start() {
        const view = this.app?.mainView;
        if (this.started || !view?.render) return;

        this.started = true;
        const originalRender = view.render.bind(view);
        view.render = state => {
            originalRender(state);
            this.apply();
        };
    }

    apply() {
        const task = this.app?.selectedTask;
        if (
            !isTaskCreationDraft(task) ||
            isSubtaskCreationDraft(task) ||
            this.document?.getElementById?.("interpretNaturalTaskEntry")
        ) {
            return;
        }

        const titleInput = this.document?.getElementById?.(
            "taskTitleEdit"
        );
        if (!titleInput || !this.document?.createElement) return;

        const controls = this.document.createElement("div");
        controls.className = "naturalTaskEntryControls";

        const button = this.document.createElement("button");
        button.id = "interpretNaturalTaskEntry";
        button.type = "button";
        button.className = "naturalTaskEntryButton";
        button.innerHTML = `${Icon.render("check")}<span>Interpretar</span>`;

        const help = this.document.createElement("span");
        help.className = "naturalTaskEntryHelp";
        help.textContent = "Fechas · /área · @contexto · #etiqueta · !1–!4";

        const status = this.document.createElement("p");
        status.id = "naturalTaskEntryStatus";
        status.className = "naturalTaskEntryStatus";
        status.setAttribute("role", "status");
        status.hidden = true;

        controls.append(button, help, status);
        titleInput.insertAdjacentElement("afterend", controls);

        const updateButton = () => {
            button.disabled = !titleInput.value.trim();
        };
        titleInput.addEventListener("input", updateButton);
        button.addEventListener("click", () => this.interpret(titleInput));
        updateButton();
    }

    interpret(titleInput) {
        const result = parseNaturalTaskEntry(
            titleInput?.value,
            {
                today: this.app?.getTodayString?.(),
                areas: this.app?.areaService?.getAllAreas?.() || [],
                contexts: this.app?.contextService?.getAllContexts?.() || [],
                tags: this.app?.tagService?.getAllTags?.() || []
            }
        );
        const applied = [];
        const warnings = [...result.warnings];

        if (result.title && result.title !== titleInput.value.trim()) {
            titleInput.value = result.title;
            this.dispatch(titleInput, "input");
        }

        if (result.dueDate) {
            this.setValue("taskDueDate", result.dueDate);
            applied.push(this.labelFor(result, "date"));
        }

        if (result.dueTime) {
            const dateInput = this.document?.getElementById?.("taskDueDate");
            if (dateInput?.value) {
                const timeInput = this.document?.getElementById?.("taskDueTime");
                if (timeInput) timeInput.disabled = false;
                this.setValue("taskDueTime", result.dueTime);
                applied.push(this.labelFor(result, "time"));
            } else {
                warnings.push("No se aplicó la hora porque la tarea no tiene fecha.");
            }
        }

        if (result.priority) {
            this.setValue("taskPriority", String(result.priority));
            applied.push(this.labelFor(result, "priority"));
        }

        if (result.areaId) {
            this.setValue("taskArea", result.areaId);
            applied.push(this.labelFor(result, "area"));
        }

        if (result.contextId) {
            this.setValue("taskContext", result.contextId);
            applied.push(this.labelFor(result, "context"));
        }

        const addedTags = this.addTags(result.tagIds);
        applied.push(
            ...result.recognized
                .filter(item => item.type === "tag" && addedTags.has(item.value))
                .map(item => item.label)
        );

        this.showStatus({ applied: applied.filter(Boolean), warnings });
        titleInput?.focus?.();
    }

    labelFor(result, type) {
        return result.recognized.find(
            item => item.type === type
        )?.label || "";
    }

    setValue(id, value) {
        const control = this.document?.getElementById?.(id);
        if (!control) return;
        control.value = value;
        this.dispatch(control, "input");
        this.dispatch(control, "change");
    }

    dispatch(control, type) {
        const EventConstructor =
            this.document?.defaultView?.Event ??
            globalThis.Event;
        if (
            typeof EventConstructor === "function" &&
            typeof control?.dispatchEvent === "function"
        ) {
            control.dispatchEvent(
                new EventConstructor(type, { bubbles: true })
            );
        }
    }

    addTags(tagIds) {
        const selected = this.document?.getElementById?.(
            "taskTagsSelected"
        );
        if (!selected) return new Set();

        const added = new Set();
        const existing = new Set(
            Array.from(
                selected.querySelectorAll?.(".taskTag") || []
            ).map(input => String(input.value))
        );

        for (const tagId of tagIds) {
            if (existing.has(String(tagId))) continue;
            const tag = this.app?.tagService?.getTagById?.(tagId);
            if (!tag) continue;

            selected.querySelector?.(
                ".searchableMultiSelectEmpty"
            )?.remove?.();
            selected.append(
                this.createTagChip(tag)
            );
            existing.add(String(tagId));
            added.add(String(tagId));

            const options = this.document?.getElementById?.(
                "taskTagsOptions"
            );
            const option = Array.from(options?.options || [])
                .find(item => item.value === String(tagId));
            if (option) option.dataset.excluded = "true";
        }

        const count = this.document?.getElementById?.("taskTagsCount");
        if (count) count.textContent = String(existing.size);
        return added;
    }

    createTagChip(tag) {
        const chip = this.document.createElement("span");
        chip.className = "searchableMultiSelectChip";
        chip.dataset.value = String(tag.id);

        const marker = this.document.createElement("span");
        marker.className = "searchableMultiSelectColor";
        marker.style.backgroundColor = tag.color || "";

        const label = this.document.createElement("span");
        label.textContent = tag.name;

        const remove = this.document.createElement("button");
        remove.type = "button";
        remove.className = "searchableMultiSelectRemove";
        remove.setAttribute("aria-label", `Quitar ${tag.name}`);
        remove.innerHTML = Icon.render("close", "chipRemoveIcon");

        const input = this.document.createElement("input");
        input.type = "hidden";
        input.className = "taskTag";
        input.value = String(tag.id);

        chip.append(marker, label, remove, input);
        return chip;
    }

    showStatus({ applied, warnings }) {
        const status = this.document?.getElementById?.(
            "naturalTaskEntryStatus"
        );
        if (!status) return;

        const messages = [];
        if (applied.length) {
            messages.push(`Interpretado: ${applied.join(" · ")}.`);
        } else {
            messages.push("No se encontraron datos reconocibles para aplicar.");
        }
        if (warnings.length) messages.push(warnings.join(" "));

        status.textContent = messages.join(" ");
        status.hidden = false;
    }

}
