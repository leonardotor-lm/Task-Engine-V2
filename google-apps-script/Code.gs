var TASK_ENGINE_SETTINGS = Object.freeze({
    SPREADSHEET_ID_PROPERTY: "TASK_ENGINE_SPREADSHEET_ID",
    TOKEN_PROPERTY: "TASK_ENGINE_TOKEN",
    DATA_SHEET: "TaskEngineData",
    META_SHEET: "TaskEngineMeta",
    BACKUP_FORMAT: "task-engine-v2-backup",
    BACKUP_VERSION: 1,
    MAX_PAYLOAD_LENGTH: 45000
});

function setupTaskEngine() {

    var spreadsheet = getSpreadsheet_();

    ensureStorage_(spreadsheet);

    return {
        spreadsheetId: spreadsheet.getId(),
        spreadsheetName: spreadsheet.getName()
    };

}

function doGet(event) {

    return handleRequest_(event, "GET");

}

function doPost(event) {

    return handleRequest_(event, "POST");

}

function handleRequest_(event, method) {

    try {

        authorize_(event);

        var action =
            event &&
            event.parameter &&
            event.parameter.action;

        if (method === "GET" && action === "load") {
            return jsonResponse_(loadSnapshot_());
        }

        if (method === "POST" && action === "save") {

            var body = parseRequestBody_(event);

            if (body.action !== "save") {
                throw protocolError_(
                    "INVALID_ACTION",
                    "La acción solicitada no es válida."
                );
            }

            return jsonResponse_(
                saveSnapshot_(
                    body.data,
                    body.baseRevision
                )
            );

        }

        throw protocolError_(
            "INVALID_ACTION",
            "La acción solicitada no es válida."
        );

    } catch (error) {

        return jsonResponse_({
            ok: false,
            error: {
                code:
                    error.code ||
                    "INTERNAL_ERROR",
                message:
                    error.publicMessage ||
                    "No se pudo completar la sincronización.",
                remoteRevision:
                    error.remoteRevision !== undefined
                        ? error.remoteRevision
                        : null
            }
        });

    }

}

function authorize_(event) {

    var properties =
        PropertiesService.getScriptProperties();

    var expectedToken =
        properties.getProperty(
            TASK_ENGINE_SETTINGS.TOKEN_PROPERTY
        );

    if (!expectedToken) {
        throw protocolError_(
            "SERVER_NOT_CONFIGURED",
            "El servidor de sincronización no está configurado."
        );
    }

    var receivedToken =
        event &&
        event.parameter &&
        event.parameter.token;

    if (
        !receivedToken ||
        receivedToken !== expectedToken
    ) {
        throw protocolError_(
            "UNAUTHORIZED",
            "Token de sincronización inválido."
        );
    }

}

function parseRequestBody_(event) {

    try {

        return JSON.parse(
            event.postData &&
            event.postData.contents
                ? event.postData.contents
                : ""
        );

    } catch (error) {

        throw protocolError_(
            "INVALID_JSON",
            "El cuerpo de la solicitud no contiene un JSON válido."
        );

    }

}

function getSpreadsheet_() {

    var spreadsheetId =
        PropertiesService
            .getScriptProperties()
            .getProperty(
                TASK_ENGINE_SETTINGS
                    .SPREADSHEET_ID_PROPERTY
            );

    if (!spreadsheetId) {
        throw protocolError_(
            "SERVER_NOT_CONFIGURED",
            "Falta configurar TASK_ENGINE_SPREADSHEET_ID."
        );
    }

    try {
        return SpreadsheetApp.openById(
            spreadsheetId
        );
    } catch (error) {
        throw protocolError_(
            "SPREADSHEET_UNAVAILABLE",
            "No se pudo abrir la hoja de cálculo configurada."
        );
    }

}

function ensureStorage_(spreadsheet) {

    var dataSheet =
        spreadsheet.getSheetByName(
            TASK_ENGINE_SETTINGS.DATA_SHEET
        );

    if (!dataSheet) {

        dataSheet = spreadsheet.insertSheet(
            TASK_ENGINE_SETTINGS.DATA_SHEET
        );

        dataSheet.getRange(1, 1, 1, 6)
            .setValues([[
                "revision",
                "type",
                "id",
                "version",
                "updatedAt",
                "payload"
            ]]);

        dataSheet.setFrozenRows(1);

    }

    var metaSheet =
        spreadsheet.getSheetByName(
            TASK_ENGINE_SETTINGS.META_SHEET
        );

    if (!metaSheet) {

        metaSheet = spreadsheet.insertSheet(
            TASK_ENGINE_SETTINGS.META_SHEET
        );

        metaSheet.getRange(1, 1, 1, 3)
            .setValues([[
                "revision",
                "updatedAt",
                "formatVersion"
            ]]);

        metaSheet.getRange(2, 1, 1, 3)
            .setValues([[
                0,
                "",
                TASK_ENGINE_SETTINGS
                    .BACKUP_VERSION
            ]]);

        metaSheet.setFrozenRows(1);

    }

    return {
        dataSheet: dataSheet,
        metaSheet: metaSheet
    };

}

function getStorage_() {

    return ensureStorage_(
        getSpreadsheet_()
    );

}

function getRevision_(metaSheet) {

    var value =
        metaSheet.getRange(2, 1).getValue();

    var revision = Number(value);

    return Number.isInteger(revision) &&
        revision >= 0
        ? revision
        : 0;

}

function loadSnapshot_() {

    var storage = getStorage_();
    var revision =
        getRevision_(storage.metaSheet);

    if (revision === 0) {
        return {
            ok: true,
            revision: 0,
            data: null
        };
    }

    var collections = {
        tasks: [],
        areas: [],
        contexts: [],
        tags: []
    };

    var typeToCollection = {
        task: "tasks",
        area: "areas",
        context: "contexts",
        tag: "tags"
    };

    var lastRow =
        storage.dataSheet.getLastRow();

    if (lastRow >= 2) {

        var rows = storage.dataSheet
            .getRange(
                2,
                1,
                lastRow - 1,
                6
            )
            .getValues();

        rows.forEach(function(row) {

            if (Number(row[0]) !== revision) {
                return;
            }

            var collection =
                typeToCollection[row[1]];

            if (!collection) {
                return;
            }

            try {
                collections[collection].push(
                    JSON.parse(row[5])
                );
            } catch (error) {
                throw protocolError_(
                    "CORRUPT_REMOTE_DATA",
                    "La hoja contiene datos remotos dañados."
                );
            }

        });

    }

    return {
        ok: true,
        revision: revision,
        data: {
            format:
                TASK_ENGINE_SETTINGS.BACKUP_FORMAT,
            version:
                TASK_ENGINE_SETTINGS.BACKUP_VERSION,
            exportedAt:
                storage.metaSheet
                    .getRange(2, 2)
                    .getDisplayValue() ||
                new Date().toISOString(),
            data: collections
        }
    };

}

function saveSnapshot_(
    snapshot,
    baseRevision
) {

    var lock = LockService.getScriptLock();

    if (!lock.tryLock(20000)) {
        throw protocolError_(
            "SERVER_BUSY",
            "El servidor está ocupado. Intentá nuevamente."
        );
    }

    try {

        var storage = getStorage_();
        var currentRevision =
            getRevision_(storage.metaSheet);

        if (
            !Number.isInteger(baseRevision) ||
            baseRevision < 0
        ) {
            throw protocolError_(
                "INVALID_REVISION",
                "La revisión enviada no es válida."
            );
        }

        if (baseRevision !== currentRevision) {

            var conflict = protocolError_(
                "CONFLICT",
                "Hay cambios más recientes en la nube."
            );

            conflict.remoteRevision =
                currentRevision;

            throw conflict;

        }

        var rows = snapshotToRows_(
            snapshot,
            currentRevision + 1
        );

        if (rows.length > 0) {

            var firstRow =
                storage.dataSheet
                    .getLastRow() + 1;

            storage.dataSheet
                .getRange(
                    firstRow,
                    1,
                    rows.length,
                    6
                )
                .setValues(rows);

        }

        var nextRevision =
            currentRevision + 1;

        storage.metaSheet
            .getRange(2, 1, 1, 3)
            .setValues([[
                nextRevision,
                new Date().toISOString(),
                TASK_ENGINE_SETTINGS
                    .BACKUP_VERSION
            ]]);

        SpreadsheetApp.flush();

        return {
            ok: true,
            revision: nextRevision
        };

    } finally {

        lock.releaseLock();

    }

}

function snapshotToRows_(
    snapshot,
    revision
) {

    validateSnapshot_(snapshot);

    var definitions = [
        ["tasks", "task"],
        ["areas", "area"],
        ["contexts", "context"],
        ["tags", "tag"]
    ];

    var rows = [];

    definitions.forEach(function(definition) {

        var collectionName = definition[0];
        var type = definition[1];

        snapshot.data[collectionName]
            .forEach(function(entity) {

                var payload =
                    JSON.stringify(entity);

                if (
                    payload.length >
                    TASK_ENGINE_SETTINGS
                        .MAX_PAYLOAD_LENGTH
                ) {
                    throw protocolError_(
                        "ENTITY_TOO_LARGE",
                        "Una entidad supera el tamaño permitido por Google Sheets."
                    );
                }

                rows.push([
                    revision,
                    type,
                    entity.id,
                    entity.version,
                    entity.updatedAt || "",
                    payload
                ]);

            });

    });

    return rows;

}

function validateSnapshot_(snapshot) {

    if (
        !snapshot ||
        snapshot.format !==
            TASK_ENGINE_SETTINGS.BACKUP_FORMAT ||
        snapshot.version !==
            TASK_ENGINE_SETTINGS.BACKUP_VERSION ||
        !snapshot.data
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia enviada no es compatible."
        );
    }

    var collectionNames = [
        "tasks",
        "areas",
        "contexts",
        "tags"
    ];

    var idsByCollection = {};

    collectionNames.forEach(function(name) {

        var collection =
            snapshot.data[name];

        if (!Array.isArray(collection)) {
            throw protocolError_(
                "INVALID_SNAPSHOT",
                "La copia enviada está incompleta."
            );
        }

        var ids = {};

        collection.forEach(function(entity) {

            validateEntity_(entity, name);

            if (ids[entity.id]) {
                throw protocolError_(
                    "DUPLICATE_ID",
                    "La copia contiene identificadores duplicados."
                );
            }

            ids[entity.id] = true;

        });

        idsByCollection[name] = ids;

    });

    validateTaskReferences_(
        snapshot.data.tasks,
        idsByCollection
    );

}

function validateEntity_(
    entity,
    collectionName
) {

    if (
        !entity ||
        typeof entity.id !== "string" ||
        !/^[A-Za-z0-9_-]+$/.test(entity.id)
    ) {
        throw protocolError_(
            "INVALID_ENTITY",
            "Hay un identificador inválido en " +
                collectionName + "."
        );
    }

    if (
        !Number.isInteger(entity.version) ||
        entity.version < 1
    ) {
        throw protocolError_(
            "INVALID_ENTITY_VERSION",
            "Hay una versión de entidad inválida."
        );
    }

}

function validateTaskReferences_(
    tasks,
    ids
) {

    var validStatuses = {
        INBOX: true,
        PENDING: true,
        COMPLETED: true,
        ARCHIVED: true,
        DELETED: true
    };

    tasks.forEach(function(task) {

        if (!validStatuses[task.status]) {
            throw protocolError_(
                "INVALID_TASK_STATUS",
                "Una tarea contiene un estado inválido."
            );
        }

        if (
            task.parentTaskId &&
            !ids.tasks[task.parentTaskId]
        ) {
            throw protocolError_(
                "INVALID_REFERENCE",
                "Una tarea referencia una tarea padre inexistente."
            );
        }

        if (
            task.areaId &&
            !ids.areas[task.areaId]
        ) {
            throw protocolError_(
                "INVALID_REFERENCE",
                "Una tarea referencia un área inexistente."
            );
        }

        if (
            task.contextId &&
            !ids.contexts[task.contextId]
        ) {
            throw protocolError_(
                "INVALID_REFERENCE",
                "Una tarea referencia un contexto inexistente."
            );
        }

        if (!Array.isArray(task.tagIds)) {
            throw protocolError_(
                "INVALID_REFERENCE",
                "Una tarea contiene etiquetas inválidas."
            );
        }

        task.tagIds.forEach(function(tagId) {

            if (!ids.tags[tagId]) {
                throw protocolError_(
                    "INVALID_REFERENCE",
                    "Una tarea referencia una etiqueta inexistente."
                );
            }

        });

    });

    var tasksById = {};

    tasks.forEach(function(task) {
        tasksById[task.id] = task;
    });

    tasks.forEach(function(task) {

        var visited = {};
        var current = task;

        while (current && current.parentTaskId) {

            if (visited[current.id]) {
                throw protocolError_(
                    "INVALID_TASK_TREE",
                    "La jerarquía de tareas contiene un ciclo."
                );
            }

            visited[current.id] = true;

            current =
                tasksById[current.parentTaskId];

        }

    });

}

function protocolError_(
    code,
    publicMessage
) {

    var error = new Error(publicMessage);

    error.code = code;
    error.publicMessage = publicMessage;

    return error;

}

function jsonResponse_(payload) {

    return ContentService
        .createTextOutput(
            JSON.stringify(payload)
        )
        .setMimeType(
            ContentService.MimeType.JSON
        );

}
