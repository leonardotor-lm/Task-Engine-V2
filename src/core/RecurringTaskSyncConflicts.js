// No descartar tareas al reconciliar: dos pendientes de una serie requieren
// resolver el conflicto antes de guardar el resultado de la sincronización.
export function getRecurringTaskSyncConflicts(tasks = []) {
    const activeSeries = new Set();
    const conflicts = new Set();

    for (const task of tasks) {
        if (
            !task.recurrenceId || !task.recurrence ||
            !["INBOX", "PENDING"].includes(task.status)
        ) continue;

        if (activeSeries.has(task.recurrenceId)) {
            conflicts.add(`tasks:recurrence:${task.recurrenceId}`);
        }
        activeSeries.add(task.recurrenceId);
    }

    return [...conflicts];
}
