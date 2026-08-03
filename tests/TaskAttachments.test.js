import test from "node:test";
import assert from "node:assert/strict";

import {
    MAX_ATTACHMENTS_PER_TASK,
    MAX_ATTACHMENT_BYTES,
    normalizeAttachment
} from "../src/domain/Attachment.js";
import { Task } from "../src/domain/Task.js";
import { TaskRepository } from "../src/infrastructure/TaskRepository.js";
import { TaskService } from "../src/core/TaskService.js";

globalThis.localStorage = {
    data: new Map(),
    getItem(key) {
        return this.data.get(key) ?? null;
    },
    setItem(key, value) {
        this.data.set(key, String(value));
    }
};

function attachment(index = 1, overrides = {}) {
    return {
        id: `attachment-${index}`,
        driveFileId: `drive-file-${index}`,
        name: `Documento ${index}.pdf`,
        mimeType: "application/pdf",
        size: 1024,
        url: `https://drive.google.com/file/d/drive-file-${index}/view`,
        createdAt: "2026-08-03T20:00:00.000Z",
        ...overrides
    };
}

test("normaliza metadatos válidos de Google Drive", () => {
    assert.deepEqual(
        normalizeAttachment(attachment()),
        attachment()
    );
});

test("rechaza adjuntos grandes enlaces externos y duplicados", () => {
    assert.throws(
        () => normalizeAttachment(
            attachment(1, {
                size: 0
            })
        ),
        /tamaño válido/
    );

    assert.throws(
        () => normalizeAttachment(
            attachment(1, {
                size: MAX_ATTACHMENT_BYTES + 1
            })
        ),
        /3 MB/
    );

    assert.throws(
        () => normalizeAttachment(
            attachment(1, {
                url: "https://example.com/file.pdf"
            })
        ),
        /Google Drive/
    );

    assert.throws(
        () => new Task({
            title: "Tarea",
            attachments: [
                attachment(1),
                attachment(1)
            ]
        }),
        /duplicados/
    );
});

test("una copia de tarea vuelve a validar sus adjuntos", () => {
    const task = new Task({
        title: "Tarea",
        attachments: [attachment()]
    });
    const backup = task.toJSON();

    backup.attachments[0].url =
        "https://example.com/file.pdf";

    assert.throws(
        () => new Task(backup),
        /Google Drive/
    );
});

test("una tarea admite hasta diez adjuntos", () => {
    const task = new Task({
        title: "Tarea",
        attachments: Array.from(
            {
                length:
                    MAX_ATTACHMENTS_PER_TASK
            },
            (_, index) =>
                attachment(index + 1)
        )
    });

    assert.throws(
        () => task.addAttachment(
            attachment(20)
        ),
        /hasta 10 adjuntos/
    );
});

test("agrega y quita adjuntos persistiendo la tarea", () => {
    localStorage.data.clear();
    const repository = new TaskRepository();
    const service = new TaskService(repository);
    const task = service.createTask({
        id: "task-1",
        title: "Tarea"
    });
    const initialVersion = task.version;

    service.addTaskAttachment(
        task.id,
        attachment()
    );

    assert.equal(task.attachments.length, 1);
    assert.equal(task.version, initialVersion + 1);

    const removed = service.removeTaskAttachment(
        task.id,
        "attachment-1"
    );

    assert.equal(
        removed.driveFileId,
        "drive-file-1"
    );
    assert.equal(task.attachments.length, 0);
    assert.equal(task.version, initialVersion + 2);
});

test("serializa los adjuntos sin compartir referencias", () => {
    const task = new Task({
        title: "Tarea",
        attachments: [attachment()]
    });
    const json = task.toJSON();

    json.attachments[0].name = "Modificado";

    assert.equal(
        task.attachments[0].name,
        "Documento 1.pdf"
    );
});
