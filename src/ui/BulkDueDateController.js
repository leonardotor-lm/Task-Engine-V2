import { Dialog } from "../components/Dialog.js";

export class BulkDueDateController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.originalRender = null;

    }

    start() {

        const mainView = this.app?.mainView;

        if (
            !mainView ||
            this.originalRender ||
            typeof mainView.render !== "function"
        ) {
            return;
        }

        this.originalRender =
            mainView.render.bind(mainView);

        mainView.render = (...args) => {

            const result =
                this.originalRender(...args);

            this.bindClearDueDateAction();

            return result;

        };

        this.bindClearDueDateAction();

    }

    bindClearDueDateAction() {

        const dueDate = this.document
            ?.getElementById?.("bulkDueDate");

        if (!dueDate) return;

        const container = dueDate.closest?.(
            ".bulkControl"
        );

        if (
            !container ||
            this.document.getElementById(
                "bulkClearDueDate"
            )
        ) {
            return;
        }

        const button = this.document
            .createElement("button");

        button.id = "bulkClearDueDate";
        button.type = "button";
        button.className =
            "secondaryAction bulkClearDueDateAction";
        button.textContent = "Limpiar fecha";
        button.setAttribute(
            "aria-label",
            "Quitar fecha y hora de vencimiento de las tareas seleccionadas"
        );

        button.addEventListener(
            "click",
            () => this.clearSelectedDueDates()
        );

        container.appendChild(button);

    }

    clearSelectedDueDates() {

        const selectedIds = [
            ...(this.app?.selectedTaskIds ?? [])
        ];

        if (selectedIds.length === 0) {
            return 0;
        }

        const recurringTasks = selectedIds
            .map(id =>
                this.app.taskService
                    ?.getTaskById?.(id)
            )
            .filter(task =>
                task?.recurrence
            );

        if (recurringTasks.length > 0) {

            Dialog.alert(
                "No se puede limpiar la fecha de una tarea recurrente porque la recurrencia necesita una fecha de vencimiento. Deseleccioná las tareas recurrentes e intentá nuevamente."
            );

            return 0;

        }

        try {

            const count = this.app.mainView
                .callbacks.onBulkUpdateTasks({
                    dueDate: null,
                    dueTime: null
                });

            Dialog.alert(
                `Se limpió la fecha de ${count} ${count === 1 ? "tarea" : "tareas"}.`
            );

            return count;

        } catch (error) {

            Dialog.alert(error.message);
            return 0;

        }

    }

}
