import {
    RecurrenceFrequency,
    isBusinessMonthlyRecurrenceFrequency
} from "../domain/Recurrence.js";

const BUSINESS_RECURRENCE_OPTIONS = Object.freeze([
    {
        value:
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIRST,
        label: "Primer día hábil del mes"
    },
    {
        value:
            RecurrenceFrequency
                .MONTHLY_BUSINESS_SECOND,
        label: "Segundo día hábil del mes"
    },
    {
        value:
            RecurrenceFrequency
                .MONTHLY_BUSINESS_THIRD,
        label: "Tercer día hábil del mes"
    },
    {
        value:
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FOURTH,
        label: "Cuarto día hábil del mes"
    },
    {
        value:
            RecurrenceFrequency
                .MONTHLY_BUSINESS_FIFTH,
        label: "Quinto día hábil del mes"
    },
    {
        value:
            RecurrenceFrequency
                .MONTHLY_BUSINESS_LAST,
        label: "Último día hábil del mes"
    }
]);

const RECURRENCE_LABELS = new Map(
    BUSINESS_RECURRENCE_OPTIONS.map(
        option => [option.value, option.label]
    )
);

export class BusinessDayRecurrenceController {

    constructor(app) {
        this.app = app;
        this.started = false;
        this.appRoot = null;
        this.onChange =
            this.onChange.bind(this);
        this.onClick =
            this.onClick.bind(this);
    }

    start() {

        if (
            this.started ||
            !this.app?.mainView?.taskEditor
        ) {
            return;
        }

        this.started = true;
        this.wrapTaskEditorRender();

        this.appRoot =
            document.getElementById("app");

        this.appRoot?.addEventListener(
            "change",
            this.onChange
        );
        this.appRoot?.addEventListener(
            "click",
            this.onClick
        );

    }

    wrapTaskEditorRender() {

        const editor =
            this.app.mainView.taskEditor;
        const originalRender =
            editor.render.bind(editor);

        editor.render = (...args) => {

            const task = args[0];
            const html = originalRender(...args);

            if (!task || !html) {
                return html;
            }

            return this.decorateEditorHtml(
                html,
                task
            );

        };

    }

    decorateEditorHtml(html, task) {

        const options =
            BUSINESS_RECURRENCE_OPTIONS
                .map(option => `
            <option
                value="${option.value}"
                ${task.recurrence === option.value
                    ? "selected"
                    : ""}>
                ${option.label}
            </option>`)
                .join("");

        let decorated = html.replace(
            /(<select\s+[^>]*id="taskRecurrence"[\s\S]*?)(<\/select>)/,
            `$1${options}\n        $2`
        );

        const label =
            RECURRENCE_LABELS.get(
                task.recurrence
            );

        if (label) {
            decorated = decorated.replace(
                "Recurrente: undefined",
                `Recurrente: ${label}`
            );

            decorated = decorated.replace(
                /(<span\s+id="recurrenceIntervalUnit">)\s*unidad\s*(<\/span>)/,
                "$1mes(es)$2"
            );
        }

        return decorated;

    }

    onChange(event) {

        if (event.target?.id !== "taskRecurrence") {
            return;
        }

        this.syncIntervalUnit(
            event.target.value
        );

    }

    onClick(event) {

        if (
            !event.target?.closest?.(
                "#cancelRecurrence"
            )
        ) {
            return;
        }

        queueMicrotask(() => {
            this.syncIntervalUnit(
                document.getElementById(
                    "taskRecurrence"
                )?.value ?? ""
            );
        });

    }

    syncIntervalUnit(frequency) {

        const unit = document.getElementById(
            "recurrenceIntervalUnit"
        );

        if (!unit) return;

        if (
            isBusinessMonthlyRecurrenceFrequency(
                frequency
            )
        ) {
            unit.textContent = "mes(es)";
            return;
        }

        const units = {
            [RecurrenceFrequency.DAILY]:
                "día(s)",
            [RecurrenceFrequency.WEEKLY]:
                "semana(s)",
            [RecurrenceFrequency.MONTHLY]:
                "mes(es)"
        };

        unit.textContent =
            units[frequency] ?? "unidad";

    }

}
