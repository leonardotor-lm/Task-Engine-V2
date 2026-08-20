export class RecurrenceLifecycleController {

    constructor(app) {
        this.app = app;
        this.started = false;
    }

    start() {

        if (this.started || !this.app?.taskService) {
            return;
        }

        this.started = true;

        this.wrapTaskServiceMethod("toggleTask");
        this.wrapTaskServiceMethod("completeTasks");

    }

    wrapTaskServiceMethod(methodName) {

        const service = this.app.taskService;
        const original = service[methodName]
            ?.bind(service);

        if (!original) return;

        service[methodName] = (...args) => {

            const existingIds = new Set(
                service
                    .getAllTasks()
                    .map(task => task.id)
            );

            const result = original(...args);

            this.removeNewDuplicateOccurrences(
                existingIds
            );

            return result;

        };

    }

    removeNewDuplicateOccurrences(existingIds) {

        const service = this.app.taskService;
        const activeBySeries = new Map();
        const removableIds = new Set();

        for (const task of service.getAllTasks()) {

            if (
                !task.recurrenceId ||
                !task.recurrence ||
                task.isCompleted() ||
                task.isArchived() ||
                task.isDeleted()
            ) {
                continue;
            }

            const previous =
                activeBySeries.get(
                    task.recurrenceId
                );

            if (!previous) {
                activeBySeries.set(
                    task.recurrenceId,
                    task
                );
                continue;
            }

            const previousExisted =
                existingIds.has(previous.id);
            const currentExisted =
                existingIds.has(task.id);

            if (previousExisted && currentExisted) {
                continue;
            }

            if (previousExisted) {
                removableIds.add(task.id);
                continue;
            }

            if (currentExisted) {
                removableIds.add(previous.id);
                activeBySeries.set(
                    task.recurrenceId,
                    task
                );
                continue;
            }

            removableIds.add(task.id);

        }

        for (const id of removableIds) {
            service.repository.remove(id);
        }

    }

}
