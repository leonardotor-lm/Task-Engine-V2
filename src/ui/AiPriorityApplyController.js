import { Dialog } from "../components/Dialog.js";

const MIN_PRIORITY = 0;
const MAX_PRIORITY = 4;

function isValidPriority(value) {
    return Number.isInteger(value) &&
        value >= MIN_PRIORITY &&
        value <= MAX_PRIORITY;
}

export class AiPriorityApplyController {

    constructor(
        app,
        proposalController,
        { documentRef = globalThis.document } = {}
    ) {
        this.app = app;
        this.proposalController = proposalController;
        this.document = documentRef;
        this.started = false;
        this.originalRenderDialog = null;
    }

    start() {
        if (
            this.started ||
            !this.proposalController?.renderDialog
        ) {
            return;
        }

        this.started = true;
        this.originalRenderDialog =
            this.proposalController.renderDialog
                .bind(this.proposalController);

        this.proposalController.renderDialog = (...args) => {
            const result = this.originalRenderDialog(...args);
            this.decorateReview();
            return result;
        };

        this.decorateReview();
    }

    getSelectedItems() {
        const items = Array.isArray(
            this.proposalController?.proposal?.items
        )
            ? this.proposalController.proposal.items
            : [];

        return items.filter(item =>
            item?.selected !== false
        );
    }

    decorateReview() {
        const proposal = this.proposalController?.proposal;
        if (!proposal?.items?.length) return;

        const actions = this.document?.querySelector?.(
            ".aiPriorityProposalActions"
        );
        if (!actions) return;

        const existing = this.document.getElementById(
            "applyAiPriorityProposal"
        );
        if (existing) return;

        const selectedCount = this.getSelectedItems().length;
        const button = this.document.createElement("button");
        button.id = "applyAiPriorityProposal";
        button.type = "button";
        button.className = "primaryAction";
        button.textContent = selectedCount === 1
            ? "Aplicar 1 cambio"
            : `Aplicar ${selectedCount} cambios`;
        button.disabled = selectedCount === 0;
        button.addEventListener(
            "click",
            () => this.confirmAndApply()
        );

        actions.prepend(button);

        const hint = this.document.createElement("p");
        hint.className = "settingsHint aiPriorityApplyHint";
        hint.textContent =
            "Aplicar modifica únicamente las prioridades seleccionadas y requiere confirmación explícita.";
        actions.before(hint);
    }

    validateSelectedItems() {
        const selected = this.getSelectedItems();

        if (!selected.length) {
            throw new Error(
                "Seleccioná al menos una sugerencia para aplicar."
            );
        }

        const seen = new Set();
        const validated = [];

        for (const item of selected) {
            const taskId = String(item?.taskId || "").trim();
            const nextPriority = Number(item?.priority);
            const expectedPriority = Number(
                item?.currentPriority ?? 0
            );

            if (!taskId || seen.has(taskId)) {
                throw new Error(
                    "La propuesta contiene una referencia de tarea inválida o duplicada."
                );
            }

            if (
                !isValidPriority(nextPriority) ||
                !isValidPriority(expectedPriority)
            ) {
                throw new Error(
                    "La propuesta contiene una prioridad inválida."
                );
            }

            const task = this.app?.taskService
                ?.getTaskById?.(taskId);

            if (!task || task.status !== "PENDING") {
                throw new Error(
                    "Una de las tareas propuestas ya no está pendiente. Generá una propuesta nueva antes de aplicar cambios."
                );
            }

            if (Number(task.priority ?? 0) !== expectedPriority) {
                throw new Error(
                    `La prioridad de “${task.title}” cambió desde que se generó la propuesta. Generá una propuesta nueva antes de aplicar cambios.`
                );
            }

            seen.add(taskId);
            validated.push({
                task,
                priority: nextPriority
            });
        }

        return validated;
    }

    async confirmAndApply() {
        let changes;

        try {
            changes = this.validateSelectedItems()
                .filter(({ task, priority }) =>
                    Number(task.priority ?? 0) !== priority
                );
        } catch (error) {
            await Dialog.alert(error.message, {
                title: "No se puede aplicar la propuesta"
            });
            return 0;
        }

        if (!changes.length) {
            await Dialog.alert(
                "Las sugerencias seleccionadas ya coinciden con las prioridades actuales.",
                { title: "Sin cambios pendientes" }
            );
            return 0;
        }

        const confirmed = await Dialog.confirmAsync(
            `Se modificarán las prioridades de ${changes.length} ${changes.length === 1 ? "tarea" : "tareas"}. La IA no escribirá en la base: Task Engine aplicará estos cambios con su servicio normal de edición.`,
            {
                title: "Aplicar prioridades sugeridas",
                confirmLabel: "Aplicar cambios",
                cancelLabel: "Cancelar"
            }
        );

        if (!confirmed) return 0;

        try {
            for (const { task, priority } of changes) {
                this.app.taskService.updateTask(
                    task.id,
                    { priority }
                );
            }

            this.proposalController.proposal = null;
            this.proposalController.error = "";
            this.app.render?.();
            this.proposalController.renderDialog?.();

            await Dialog.alert(
                `Se aplicaron ${changes.length} ${changes.length === 1 ? "cambio de prioridad" : "cambios de prioridad"}.`,
                { title: "Prioridades actualizadas" }
            );

            return changes.length;
        } catch (error) {
            await Dialog.alert(
                error?.message ||
                    "No se pudieron aplicar las prioridades seleccionadas.",
                { title: "Error al aplicar la propuesta" }
            );
            return 0;
        }
    }
}
