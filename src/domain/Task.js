import { TaskStatus } from "./TaskStatus.js";
import { Priority } from "./Priority.js";
export class Task {

    constructor(data = {}) {

        this.id = data.id ?? crypto.randomUUID();

        this.title = data.title ?? "";

        this.description = data.description ?? "";

        this.status = data.status ?? TaskStatus.INBOX;
        
        this.areaId = data.areaId ?? null;

        this.contextId = data.contextId ?? null;

        this.priority = data.priority ?? Priority.NONE;
        
        this.tagIds = data.tagIds ?? [];

        this.attachments = data.attachments ?? [];

        this.parentTaskId = data.parentTaskId ?? null;

        this.recurrenceId = data.recurrenceId ?? null;

        this.manualOrder = data.manualOrder ?? 0;

        this.createdAt = data.createdAt ?? new Date().toISOString();

        this.updatedAt = data.updatedAt ?? this.createdAt;

        this.completedAt = data.completedAt ?? null;

        this.dueDate = data.dueDate ?? null;

        this.postponements = data.postponements ?? [];

    }

    touch() {

        this.updatedAt = new Date().toISOString();

    }

    update(data = {}) {

        if (data.title !== undefined)
            this.title = data.title;

        if (data.description !== undefined)
            this.description = data.description;

        if (data.areaId !== undefined)
            this.areaId = data.areaId;

        if (data.contextId !== undefined)
            this.contextId = data.contextId;

        if (data.priority !== undefined)
            this.priority = data.priority;

        if (data.tagIds !== undefined)
            this.tagIds = [...data.tagIds];

        if (data.dueDate !== undefined)
            this.dueDate = data.dueDate;

        this.touch();

    }

    complete() {

        this.status = "COMPLETED";

        this.completedAt = new Date().toISOString();

        this.touch();

    }

    archive() {

        this.status = "ARCHIVED";

        this.touch();

    }

    delete() {

        this.status = "DELETED";

        this.touch();

    }

    restore() {

        this.status = "PENDING";

        this.touch();

    }

    postpone(newDate) {

        this.postponements.push({

            from: this.dueDate,

            to: newDate,

            date: new Date().toISOString()

        });

        this.dueDate = newDate;

        this.touch();

    }

    toJSON() {

        return {

            id: this.id,

            title: this.title,

            description: this.description,

            status: this.status,

            areaId: this.areaId,

            contextId: this.contextId,

            priority: this.priority,

            tagIds: [...this.tagIds],

            attachments: [...this.attachments],

            parentTaskId: this.parentTaskId,

            recurrenceId: this.recurrenceId,

            manualOrder: this.manualOrder,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt,

            completedAt: this.completedAt,

            dueDate: this.dueDate,

            postponements: [...this.postponements]

        };

    }

}
