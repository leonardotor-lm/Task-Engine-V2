import { Dialog } from "../components/Dialog.js";
import {
    createSubtasksAtomically,
    createTasksAtomically
} from "../core/AtomicTaskCreations.js";

export class AiTransactionalWritesController {

    constructor(
        app,
        {
            taskCaptureController = null,
            projectProposalController = null,
            notionTaskNotesController = null
        } = {}
    ) {
        this.app = app;
        this.taskCaptureController = taskCaptureController;
        this.projectProposalController = projectProposalController;
        this.notionTaskNotesController = notionTaskNotesController;
        this.started = false;
    }

    start() {
        if (this.started) return;
        this.started = true;
        this.installAtomicChangeBridge();
        this.installTaskCaptureApply();
        this.installProjectProposalApply();
    }

    installAtomicChangeBridge() {
        const service = this.app?.taskService;
        const notion = this.notionTaskNotesController;
        if (!service || !notion) return;

        service.onAtomicTaskChanges = changes => {
            const before = new Map();

            for (const change of changes || []) {
                const previous = change?.before;
                if (
                    !previous?.notionPageId ||
                    !previous?.notionPageUrl
                ) {
                    continue;
                }

                before.set(
                    previous.id,
                    notion.getSyncFingerprint(previous)
                );
            }

            notion.syncChangedLinkedTasks(before);
        };
    }

    installTaskCaptureApply() {
        const controller = this.taskCaptureController;
        if (!controller) return;

        controller.confirmAndApply = async () => {
            let tasks;
            try {
                tasks = controller.validateSelectedItems();
            } catch (error) {
                await Dialog.alert(error.message, {
                    title: "No se pueden crear las tareas"
                });
                return 0;
            }

            const confirmed = await Dialog.confirmAsync(
                `Se crearán ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"} en Inbox.`,
                {
                    title: "Crear tareas propuestas",
                    confirmLabel: "Crear tareas",
                    cancelLabel: "Cancelar"
                }
            );
            if (!confirmed) return 0;

            try {
                createTasksAtomically(
                    this.app.taskService,
                    tasks
                );
                controller.proposal = null;
                controller.sourceText = "";
                controller.error = "";
                this.app.render?.();
                controller.renderDialog();
                await Dialog.alert(
                    `Se crearon ${tasks.length} ${tasks.length === 1 ? "tarea" : "tareas"} en Inbox.`,
                    { title: "Tareas creadas" }
                );
                return tasks.length;
            } catch (error) {
                await Dialog.alert(
                    error?.message ||
                        "No se pudieron crear las tareas propuestas.",
                    { title: "Error al crear tareas" }
                );
                return 0;
            }
        };
    }

    installProjectProposalApply() {
        const controller = this.projectProposalController;
        if (!controller) return;

        controller.confirmAndApply = async () => {
            let proposals;

            try {
                proposals = controller.validateSelectedItems();
            } catch (error) {
                await Dialog.alert(error.message, {
                    title: "No se puede aplicar la propuesta"
                });
                return 0;
            }

            const subtaskCount = proposals.reduce(
                (total, proposal) =>
                    total + proposal.titles.length,
                0
            );
            const confirmed = await Dialog.confirmAsync(
                `Se convertirán ${proposals.length} ${proposals.length === 1 ? "tarea" : "tareas"} en proyecto y se crearán ${subtaskCount} subtareas. La tarea original se conservará como proyecto.`,
                {
                    title: "Crear proyectos y subtareas",
                    confirmLabel: "Crear proyectos",
                    cancelLabel: "Cancelar"
                }
            );

            if (!confirmed) return 0;

            try {
                createSubtasksAtomically(
                    this.app.taskService,
                    proposals.map(proposal => ({
                        parentId: proposal.task.id,
                        titles: proposal.titles
                    }))
                );

                controller.proposal = null;
                controller.error = "";
                this.app.render?.();
                controller.renderDialog();

                await Dialog.alert(
                    `Se crearon ${proposals.length} ${proposals.length === 1 ? "proyecto" : "proyectos"} con ${subtaskCount} subtareas.`,
                    { title: "Proyectos creados" }
                );

                return proposals.length;
            } catch (error) {
                await Dialog.alert(
                    error?.message ||
                        "No se pudieron crear los proyectos seleccionados.",
                    { title: "Error al aplicar la propuesta" }
                );
                return 0;
            }
        };
    }
}
