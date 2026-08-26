const RELATIVE_OPTIONS = Object.freeze([
    [5, "5 minutos antes"],
    [15, "15 minutos antes"],
    [30, "30 minutos antes"],
    [60, "1 hora antes"],
    [1440, "1 día antes"],
    [2880, "2 días antes"],
    [7200, "5 días antes"],
    [14400, "10 días antes"]
]);

const ABSOLUTE_PRESETS = Object.freeze([
    ["2d", "2 días"],
    ["5d", "5 días"],
    ["10d", "10 días"],
    ["1m", "1 mes"],
    ["3m", "3 meses"],
    ["6m", "6 meses"]
]);

export class CalendarReminderController {

    constructor(app) {
        this.app = app;
    }

    start() {
        this.wrapUpdateTask();
        this.wrapUnsavedTaskCheck();
        this.wrapMainViewRender();
    }

    wrapUpdateTask() {

        const callbacks = this.app.mainView.callbacks;
        const originalUpdateTask = callbacks.onUpdateTask;

        callbacks.onUpdateTask = (id, data) => {

            const reminder = this.readReminderFromEditor(data);

            return originalUpdateTask(id, {
                ...data,
                reminder
            });

        };

    }

    wrapUnsavedTaskCheck() {

        const view = this.app.mainView;
        const originalHasUnsavedTaskEdit =
            view.hasUnsavedTaskEdit.bind(view);

        view.hasUnsavedTaskEdit = task => {

            if (originalHasUnsavedTaskEdit(task)) {
                return true;
            }

            const select = document.getElementById(
                "taskReminderMode"
            );

            if (!select) return false;

            try {
                const current = this.readReminderFromEditor({
                    dueDate:
                        document.getElementById("taskDueDate")
                            ?.value || null,
                    dueTime:
                        document.getElementById("taskDueTime")
                            ?.value || null
                });

                return JSON.stringify(current) !==
                    JSON.stringify(task?.reminder ?? null);
            } catch {
                return true;
            }

        };

    }

    wrapMainViewRender() {

        const view = this.app.mainView;
        const originalRender = view.render.bind(view);

        view.render = state => {
            originalRender(state);
            this.injectReminderMetadata(
                this.app.taskService?.getAllTasks?.() ?? []
            );
            this.injectEditor(state.selectedTask);
        };

    }

    injectEditor(task) {

        if (!task || task.isCompleted() ||
            task.isArchived() || task.isDeleted()) {
            return;
        }

        const recurrenceSection =
            document.getElementById("taskRecurrence")
                ?.closest(".editorSection") ?? null;

        const body = recurrenceSection?.querySelector(
            ".editorSectionBody"
        );

        if (!body) {
            return;
        }

        this.configureProgrammingLabel(recurrenceSection);

        if (document.getElementById("taskReminderMode")) {
            return;
        }

        const reminder = task.reminder ?? null;
        const selectedMode = reminder?.type === "due"
            ? `due:${reminder.minutesBefore}`
            : reminder?.type === "at"
                ? "at"
                : "none";

        const relativeOptions = RELATIVE_OPTIONS
            .map(([minutes, label]) => `
                <option
                    value="due:${minutes}"
                    ${selectedMode === `due:${minutes}` ? "selected" : ""}>
                    ${label}
                </option>
            `)
            .join("");

        const wrapper = document.createElement("div");
        wrapper.className = "taskCalendarReminderControls";
        wrapper.innerHTML = `
            <label for="taskReminderMode">
                Recordatorio
            </label>

            <select id="taskReminderMode">
                <option value="none" ${selectedMode === "none" ? "selected" : ""}>
                    Sin recordatorio
                </option>
                <optgroup label="Antes del vencimiento">
                    ${relativeOptions}
                </optgroup>
                <option value="at" ${selectedMode === "at" ? "selected" : ""}>
                    En una fecha y hora…
                </option>
            </select>

            <div id="taskReminderAtControls" ${selectedMode === "at" ? "" : "hidden"}>
                <label for="taskReminderAt">
                    Fecha y hora del recordatorio
                </label>
                <input
                    id="taskReminderAt"
                    type="datetime-local"
                    value="${this.toLocalInputValue(reminder?.at)}">

                <div class="taskReminderPresets" aria-label="Accesos rápidos del recordatorio">
                    ${ABSOLUTE_PRESETS.map(([value, label]) => `
                        <button
                            type="button"
                            class="taskReminderPreset"
                            data-reminder-preset="${value}">
                            + ${label}
                        </button>
                    `).join("")}
                </div>

                <p class="fieldHelp">
                    Puede usarse aunque la tarea no tenga fecha de vencimiento.
                </p>
            </div>
        `;

        const recurrenceIndicator = body.querySelector(
            ".recurrenceIndicator"
        );

        if (recurrenceIndicator) {
            recurrenceIndicator.before(wrapper);
        } else {
            body.prepend(wrapper);
        }

        const mode = wrapper.querySelector("#taskReminderMode");
        const atControls = wrapper.querySelector(
            "#taskReminderAtControls"
        );

        mode.addEventListener("change", () => {
            atControls.hidden = mode.value !== "at";
        });

        wrapper.querySelectorAll(".taskReminderPreset")
            .forEach(button => {
                button.addEventListener("click", () => {
                    const input = wrapper.querySelector(
                        "#taskReminderAt"
                    );
                    input.value = this.calculatePreset(
                        button.dataset.reminderPreset
                    );
                    mode.value = "at";
                    atControls.hidden = false;
                    input.focus();
                });
            });
    }

    configureProgrammingLabel(section) {

        const summary = section?.querySelector(
            ":scope > summary"
        );

        if (summary) {
            summary.textContent = "Programación";
            summary.setAttribute(
                "aria-label",
                "Programación: recurrencia y recordatorios"
            );
        }

        for (const title of section?.querySelectorAll("strong") ?? []) {
            if (title.textContent.trim() === "Recurrencia") {
                title.textContent = "Programación";
            }
        }

    }

    injectReminderMetadata(tasks = []) {

        const tasksById = new Map(
            tasks.map(task => [String(task.id), task])
        );

        for (const row of document.querySelectorAll(
            ".task[data-id]"
        )) {

            const task = tasksById.get(String(row.dataset.id));

            if (!task?.reminder ||
                row.querySelector(".taskReminderIndicator")) {
                continue;
            }

            const taskBody = row.querySelector(".taskBody");
            const titleLine = row.querySelector(".taskTitleLine");

            if (!taskBody || !titleLine) {
                continue;
            }

            let metadata = taskBody.querySelector(".taskMeta");

            if (!metadata) {
                metadata = document.createElement("div");
                metadata.className = "taskMeta";
                titleLine.after(metadata);
            }

            const indicator = document.createElement("span");
            indicator.className = "taskReminderIndicator";
            indicator.title = "Tiene un recordatorio";
            indicator.setAttribute(
                "aria-label",
                "Tiene un recordatorio"
            );
            indicator.style.display = "inline-flex";
            indicator.style.alignItems = "center";
            indicator.style.color = "var(--color-warning)";
            indicator.innerHTML = this.renderReminderIcon();

            metadata.prepend(indicator);
        }

    }

    renderReminderIcon() {

        return `
            <svg
                class="icon taskReminderIcon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                focusable="false"
                style="width:15px;height:15px">
                <circle cx="12" cy="13" r="8"></circle>
                <path d="M12 9v4l2 2"></path>
                <path d="m5 3-2 2"></path>
                <path d="m19 3 2 2"></path>
                <path d="M6.38 18.7 4 21"></path>
                <path d="M17.64 18.67 20 21"></path>
            </svg>
        `;

    }

    readReminderFromEditor(data = {}) {

        const select = document.getElementById(
            "taskReminderMode"
        );

        if (!select || select.value === "none") {
            return null;
        }

        if (select.value.startsWith("due:")) {

            if (!data.dueDate || !data.dueTime) {
                throw new Error(
                    "Para recordar antes del vencimiento, la tarea necesita fecha y hora de vencimiento."
                );
            }

            const minutesBefore = Number(
                select.value.split(":")[1]
            );

            if (!RELATIVE_OPTIONS.some(
                ([minutes]) => minutes === minutesBefore
            )) {
                throw new Error(
                    "La anticipación del recordatorio no es válida."
                );
            }

            return {
                type: "due",
                minutesBefore
            };
        }

        const input = document.getElementById(
            "taskReminderAt"
        );
        const value = input?.value ?? "";
        const date = value ? new Date(value) : null;

        if (!date || Number.isNaN(date.getTime())) {
            throw new Error(
                "Elegí la fecha y hora del recordatorio."
            );
        }

        if (date.getTime() <= Date.now()) {
            throw new Error(
                "El recordatorio debe programarse para un momento futuro."
            );
        }

        return {
            type: "at",
            at: date.toISOString()
        };
    }

    calculatePreset(preset) {

        const date = new Date();
        date.setSeconds(0, 0);

        const dayMatch = /^(2|5|10)d$/.exec(preset);
        const monthMatch = /^(1|3|6)m$/.exec(preset);

        if (dayMatch) {
            date.setDate(
                date.getDate() + Number(dayMatch[1])
            );
        } else if (monthMatch) {
            date.setMonth(
                date.getMonth() + Number(monthMatch[1])
            );
        }

        return this.toLocalInputValue(date.toISOString());
    }

    toLocalInputValue(value) {

        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        const pad = number => String(number).padStart(2, "0");

        return [
            date.getFullYear(),
            "-",
            pad(date.getMonth() + 1),
            "-",
            pad(date.getDate()),
            "T",
            pad(date.getHours()),
            ":",
            pad(date.getMinutes())
        ].join("");
    }

}
