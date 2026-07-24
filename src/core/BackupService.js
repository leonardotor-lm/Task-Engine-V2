import { Task } from "../domain/Task.js";
import { Area } from "../domain/Area.js";
import { Context } from "../domain/Context.js";
import { Tag } from "../domain/Tag.js";
import { TaskStatus } from "../domain/TaskStatus.js";

export const BACKUP_FORMAT = "task-engine-v2-backup";
export const BACKUP_VERSION = 1;
export const LAST_IMPORT_BACKUP_KEY =
    "task-engine-v2-last-import-backup";

export class BackupService {

    constructor({
        taskRepository,
        areaRepository,
        contextRepository,
        tagRepository,
        storage = localStorage
    }) {

        this.taskRepository = taskRepository;
        this.areaRepository = areaRepository;
        this.contextRepository = contextRepository;
        this.tagRepository = tagRepository;
        this.storage = storage;

    }

    createBackup() {

        return {
            format: BACKUP_FORMAT,
            version: BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            data: {
                tasks: this.taskRepository
                    .getAll()
                    .map(task => task.toJSON()),
                areas: this.areaRepository
                    .getAll()
                    .map(area => area.toJSON()),
                contexts: this.contextRepository
                    .getAll()
                    .map(context => context.toJSON()),
                tags: this.tagRepository
                    .getAll()
                    .map(tag => tag.toJSON())
            }
        };

    }

    exportBackup() {

        return JSON.stringify(
            this.createBackup(),
            null,
            2
        );

    }

    hasLastImportBackup() {

        return Boolean(
            this.storage.getItem(
                LAST_IMPORT_BACKUP_KEY
            )
        );

    }

    parseAndValidate(json) {

        let backup;

        try {
            backup = JSON.parse(json);
        } catch {
            throw new Error(
                "El archivo no contiene un JSON válido."
            );
        }

        if (
            backup?.format !== BACKUP_FORMAT ||
            backup?.version !== BACKUP_VERSION
        ) {
            throw new Error(
                "El archivo no es una copia compatible de Task Engine V2."
            );
        }

        const data = backup.data;

        for (
            const collection of
            ["tasks", "areas", "contexts", "tags"]
        ) {

            if (!Array.isArray(data?.[collection])) {
                throw new Error(
                    `La copia no contiene una colección válida de ${collection}.`
                );
            }

        }

        let tasks;
        let areas;
        let contexts;
        let tags;

        try {

            tasks = data.tasks.map(item => new Task(item));
            areas = data.areas.map(item => new Area(item));
            contexts = data.contexts.map(
                item => new Context(item)
            );
            tags = data.tags.map(item => new Tag(item));

        } catch (error) {

            throw new Error(
                `La copia contiene datos inválidos: ${error.message}`
            );

        }

        this.validateUniqueIds(tasks, "tareas");
        this.validateUniqueIds(areas, "áreas");
        this.validateUniqueIds(contexts, "contextos");
        this.validateUniqueIds(tags, "etiquetas");

        this.validateTaskReferences({
            tasks,
            areas,
            contexts,
            tags
        });

        return {
            tasks,
            areas,
            contexts,
            tags
        };

    }

    validateUniqueIds(items, collectionName) {

        const ids = new Set();

        for (const item of items) {

            if (
                typeof item.id !== "string" ||
                !item.id.trim()
            ) {
                throw new Error(
                    `Hay un identificador inválido en ${collectionName}.`
                );
            }

            if (ids.has(item.id)) {
                throw new Error(
                    `Hay identificadores duplicados en ${collectionName}.`
                );
            }

            ids.add(item.id);

        }

    }

    validateTaskReferences({
        tasks,
        areas,
        contexts,
        tags
    }) {

        const taskIds = new Set(
            tasks.map(task => task.id)
        );

        const areaIds = new Set(
            areas.map(area => area.id)
        );

        const contextIds = new Set(
            contexts.map(context => context.id)
        );

        const tagIds = new Set(
            tags.map(tag => tag.id)
        );

        const validStatuses = new Set(
            Object.values(TaskStatus)
        );

        for (const task of tasks) {

            if (!validStatuses.has(task.status)) {
                throw new Error(
                    `La tarea "${task.title}" tiene un estado inválido.`
                );
            }

            if (
                task.parentTaskId &&
                !taskIds.has(task.parentTaskId)
            ) {
                throw new Error(
                    `La tarea "${task.title}" tiene una tarea padre inexistente.`
                );
            }

            if (
                task.parentTaskId === task.id
            ) {
                throw new Error(
                    `La tarea "${task.title}" no puede ser su propia tarea padre.`
                );
            }

            if (
                task.areaId &&
                !areaIds.has(task.areaId)
            ) {
                throw new Error(
                    `La tarea "${task.title}" referencia un área inexistente.`
                );
            }

            if (
                task.contextId &&
                !contextIds.has(task.contextId)
            ) {
                throw new Error(
                    `La tarea "${task.title}" referencia un contexto inexistente.`
                );
            }

            for (const tagId of task.tagIds) {

                if (!tagIds.has(tagId)) {
                    throw new Error(
                        `La tarea "${task.title}" referencia una etiqueta inexistente.`
                    );
                }

            }

        }

        this.validateNoParentCycles(tasks);

    }

    validateNoParentCycles(tasks) {

        const tasksById = new Map(
            tasks.map(task => [task.id, task])
        );

        for (const task of tasks) {

            const visited = new Set();
            let current = task;

            while (current?.parentTaskId) {

                if (visited.has(current.id)) {
                    throw new Error(
                        "La copia contiene un ciclo en la jerarquía de tareas."
                    );
                }

                visited.add(current.id);

                current = tasksById.get(
                    current.parentTaskId
                );

            }

        }

    }

    applyData(data) {

        this.taskRepository.replaceAll(data.tasks);
        this.areaRepository.replaceAll(data.areas);
        this.contextRepository.replaceAll(
            data.contexts
        );
        this.tagRepository.replaceAll(data.tags);

    }

    importBackup(json) {

        const data = this.parseAndValidate(json);

        this.storage.setItem(
            LAST_IMPORT_BACKUP_KEY,
            this.exportBackup()
        );

        this.applyData(data);

        return data;

    }

    restoreLastImportBackup() {

        const json = this.storage.getItem(
            LAST_IMPORT_BACKUP_KEY
        );

        if (!json) {
            throw new Error(
                "No hay una copia anterior para restaurar."
            );
        }

        const data = this.parseAndValidate(json);

        this.applyData(data);

        this.storage.removeItem(
            LAST_IMPORT_BACKUP_KEY
        );

        return data;

    }

}
