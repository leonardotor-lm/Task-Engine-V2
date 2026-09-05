var TASK_ENGINE_SETTINGS = Object.freeze({
    SPREADSHEET_ID_PROPERTY: "TASK_ENGINE_SPREADSHEET_ID",
    TOKEN_PROPERTY: "TASK_ENGINE_TOKEN",
    ATTACHMENTS_FOLDER_ID_PROPERTY: "TASK_ENGINE_ATTACHMENTS_FOLDER_ID",
    ATTACHMENTS_FOLDER_NAME: "Mis tareas - Adjuntos",
    DATA_SHEET: "TaskEngineData",
    META_SHEET: "TaskEngineMeta",
    BACKUP_FORMAT: "task-engine-v2-backup",
    BACKUP_VERSION: 1,
    SYNC_SCHEMA_VERSION: 2,
    MAX_PAYLOAD_LENGTH: 45000,
    MAX_REQUEST_LENGTH: 5000000,
    MAX_ATTACHMENT_BYTES: 3 * 1024 * 1024,
    MAX_ATTACHMENT_NAME_LENGTH: 180,
    RATE_LIMIT_WINDOW_SECONDS: 60,
    MAX_REQUESTS_PER_WINDOW: 120,
    COMPACTION_MAX_ROWS: 50000,
    COMPACTION_REVISIONS_TO_KEEP: 5,
    MAINTENANCE_TRIGGER_HANDLER:
        "runTaskEngineMaintenance"
});

function setupTaskEngine() {

    var spreadsheet = getSpreadsheet_();

    ensureStorage_(spreadsheet);

    return {
        spreadsheetId: spreadsheet.getId(),
        spreadsheetName: spreadsheet.getName()
    };

}

function installTaskEngineMaintenance() {

    var handler =
        TASK_ENGINE_SETTINGS
            .MAINTENANCE_TRIGGER_HANDLER;

    ScriptApp.getProjectTriggers()
        .forEach(function(trigger) {
            if (
                trigger.getHandlerFunction() ===
                    handler
            ) {
                ScriptApp.deleteTrigger(trigger);
            }
        });

    ScriptApp.newTrigger(handler)
        .timeBased()
        .everyDays(1)
        .atHour(3)
        .create();

    return {
        installed: true,
        handler: handler,
        frequency: "DAILY"
    };

}

function runTaskEngineMaintenance() {

    return compactTaskEngineStorage_(false);

}

function compactTaskEngineStorage() {

    return compactTaskEngineStorage_(true);

}

function doGet(event) {

    return handleRequest_(event, "GET");

}

function doPost(event) {

    return handleRequest_(event, "POST");

}

function handleRequest_(event, method) {

    try {

        var body =
            method === "POST"
                ? parseRequestBody_(event)
                : {};

        authorize_(event, body);
        enforceRateLimit_();

        var action = body.action;

        if (
            method === "POST" &&
            action === "load"
        ) {
            return jsonResponse_(loadSnapshot_());
        }

        if (method === "POST" && action === "save") {

            return jsonResponse_(
                saveSnapshot_(
                    body.data,
                    body.baseRevision
                )
            );

        }

        if (
            method === "POST" &&
            action === "uploadAttachment"
        ) {
            return jsonResponse_(
                uploadAttachment_(body.attachment)
            );
        }

        if (
            method === "POST" &&
            action === "trashAttachment"
        ) {
            return jsonResponse_(
                trashAttachment_(
                    body.driveFileId
                )
            );
        }

        if (
            method === "POST" &&
            action === "aiStatus"
        ) {
            return jsonResponse_(
                getAiStatus_(
                    body.validateRemote === true,
                    body.provider,
                    body.model
                )
            );
        }

        if (
            method === "POST" &&
            action === "aiQuery"
        ) {
            return jsonResponse_(
                queryAi_(
                    body.question,
                    body.context
                )
            );
        }

        if (
            method === "POST" &&
            action === "gptGetContext"
        ) {
            return jsonResponse_(
                gptGetContext_()
            );
        }

        if (
            method === "POST" &&
            action === "gptSearchTasks"
        ) {
            return jsonResponse_(
                gptSearchTasks_(body.input || {})
            );
        }

        if (
            method === "POST" &&
            action === "gptGetTask"
        ) {
            return jsonResponse_(
                gptGetTask_(body.input || {})
            );
        }

        if (
            method === "POST" &&
            action === "gptCreateTask"
        ) {
            return jsonResponse_(
                gptCreateTask_(body.input || {})
            );
        }

        if (
            method === "POST" &&
            action === "gptUpdateTask"
        ) {
            return jsonResponse_(
                gptUpdateTask_(body.input || {})
            );
        }

        if (
            method === "POST" &&
            action === "gptCompleteTask"
        ) {
            return jsonResponse_(
                gptCompleteTask_(body.input || {})
            );
        }

        if (
            method === "POST" &&
            action === "notionStatus"
        ) {
            return jsonResponse_(
                getNotionStatus_(
                    body.validateRemote === true
                )
            );
        }

        if (
            method === "POST" &&
            action === "createNotionTaskPage"
        ) {
            return jsonResponse_(
                createNotionTaskPage_(body.task)
            );
        }

        throw protocolError_(
            "INVALID_ACTION",
            "La acción solicitada no es válida."
        );

    } catch (error) {

        logRejectedRequest_(
            error,
            method
        );

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

function authorize_(event, body) {

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
        body &&
        body.token;

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

function enforceRateLimit_() {

    var cache =
        CacheService.getScriptCache();

    var windowNumber = Math.floor(
        Date.now() /
        (
            TASK_ENGINE_SETTINGS
                .RATE_LIMIT_WINDOW_SECONDS *
            1000
        )
    );

    var key =
        "task-engine-sync-rate-" +
        windowNumber;

    var lock = LockService.getScriptLock();

    if (!lock.tryLock(1000)) {
        throw protocolError_(
            "SERVER_BUSY",
            "El servidor está ocupado. Intentá nuevamente."
        );
    }

    try {

        var count = Number(
            cache.get(key) || 0
        );

        if (
            count >=
            TASK_ENGINE_SETTINGS
                .MAX_REQUESTS_PER_WINDOW
        ) {
            throw protocolError_(
                "RATE_LIMITED",
                "Se realizaron demasiadas solicitudes. Esperá un momento e intentá nuevamente."
            );
        }

        cache.put(
            key,
            String(count + 1),
            TASK_ENGINE_SETTINGS
                .RATE_LIMIT_WINDOW_SECONDS +
                5
        );

    } finally {

        lock.releaseLock();

    }

}

function logRejectedRequest_(
    error,
    method
) {

    var loggedCodes = {
        UNAUTHORIZED: true,
        INVALID_JSON: true,
        INVALID_ACTION: true,
        REQUEST_TOO_LARGE: true,
        RATE_LIMITED: true
    };

    if (!loggedCodes[error.code]) {
        return;
    }

    console.warn(
        JSON.stringify({
            event:
                "sync_request_rejected",
            code: error.code,
            method: method
        })
    );

}

function parseRequestBody_(event) {

    var contents =
        event &&
        event.postData &&
        event.postData.contents
            ? event.postData.contents
            : "";

    if (
        contents.length >
        TASK_ENGINE_SETTINGS
            .MAX_REQUEST_LENGTH
    ) {
        throw protocolError_(
            "REQUEST_TOO_LARGE",
            "La solicitud supera el tamaño permitido."
        );
    }

    try {

        return JSON.parse(contents);

    } catch (error) {

        throw protocolError_(
            "INVALID_JSON",
            "El cuerpo de la solicitud no contiene un JSON válido."
        );

    }

}

function getAttachmentsFolder_() {

    var properties =
        PropertiesService.getScriptProperties();
    var folderId = properties.getProperty(
        TASK_ENGINE_SETTINGS
            .ATTACHMENTS_FOLDER_ID_PROPERTY
    );
    var folder = null;

    if (folderId) {
        try {
            folder = DriveApp.getFolderById(
                folderId
            );

            if (folder.isTrashed()) {
                folder = null;
            }
        } catch (error) {
            folder = null;
        }
    }

    if (!folder) {
        folder = DriveApp.createFolder(
            TASK_ENGINE_SETTINGS
                .ATTACHMENTS_FOLDER_NAME
        );

        properties.setProperty(
            TASK_ENGINE_SETTINGS
                .ATTACHMENTS_FOLDER_ID_PROPERTY,
            folder.getId()
        );
    }

    return folder;

}

function uploadAttachment_(attachment) {

    if (!attachment) {
        throw protocolError_(
            "INVALID_ATTACHMENT",
            "No se recibió ningún adjunto."
        );
    }

    var name = String(
        attachment.name || ""
    ).trim();
    var mimeType = String(
        attachment.mimeType ||
        "application/octet-stream"
    ).trim();
    var base64Data = String(
        attachment.base64Data || ""
    );

    if (
        !name ||
        name.length >
            TASK_ENGINE_SETTINGS
                .MAX_ATTACHMENT_NAME_LENGTH ||
        /[\u0000-\u001F\u007F]/.test(name)
    ) {
        throw protocolError_(
            "INVALID_ATTACHMENT",
            "El nombre del adjunto es inválido."
        );
    }

    if (!mimeType || mimeType.length > 160) {
        throw protocolError_(
            "INVALID_ATTACHMENT",
            "El tipo del adjunto es inválido."
        );
    }

    if (
        !base64Data ||
        base64Data.length >
            Math.ceil(
                TASK_ENGINE_SETTINGS
                    .MAX_ATTACHMENT_BYTES *
                4 / 3
            ) + 4
    ) {
        throw protocolError_(
            "ATTACHMENT_TOO_LARGE",
            "El adjunto supera el límite de 3 MB."
        );
    }

    var bytes;

    try {
        bytes = Utilities.base64Decode(
            base64Data
        );
    } catch (error) {
        throw protocolError_(
            "INVALID_ATTACHMENT",
            "El contenido del adjunto es inválido."
        );
    }

    if (
        bytes.length === 0 ||
        bytes.length >
        TASK_ENGINE_SETTINGS
            .MAX_ATTACHMENT_BYTES
    ) {
        throw protocolError_(
            "ATTACHMENT_TOO_LARGE",
            "El adjunto supera el límite de 3 MB."
        );
    }

    var blob = Utilities.newBlob(
        bytes,
        mimeType,
        name
    );
    var file = getAttachmentsFolder_()
        .createFile(blob);

    file.setDescription(
        "Adjunto creado por Mis tareas."
    );

    return {
        ok: true,
        attachment: {
            id: Utilities.getUuid(),
            driveFileId: file.getId(),
            name: file.getName(),
            mimeType: file.getMimeType(),
            size: file.getSize(),
            url: file.getUrl(),
            createdAt: new Date().toISOString()
        }
    };

}

function trashAttachment_(driveFileId) {

    var id = String(driveFileId || "").trim();

    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
        throw protocolError_(
            "INVALID_ATTACHMENT",
            "El archivo de Drive es inválido."
        );
    }

    var file;

    try {
        file = DriveApp.getFileById(id);
    } catch (error) {
        throw protocolError_(
            "ATTACHMENT_NOT_FOUND",
            "El adjunto ya no existe en Google Drive."
        );
    }

    var folderId =
        getAttachmentsFolder_().getId();
    var parents = file.getParents();
    var belongsToApp = false;

    while (parents.hasNext()) {
        if (parents.next().getId() === folderId) {
            belongsToApp = true;
            break;
        }
    }

    if (!belongsToApp) {
        throw protocolError_(
            "ATTACHMENT_FORBIDDEN",
            "El archivo no pertenece a la carpeta de adjuntos de Mis tareas."
        );
    }

    file.setTrashed(true);

    return {
        ok: true,
        driveFileId: id
    };

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

function hasOwn_(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object || {},
        property
    );

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

    var rows = getRevisionRows_(
        storage.dataSheet,
        revision
    );

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
            data: rowsToSnapshotData_(rows)
        }
    };

}

function getRevisionRows_(
    dataSheet,
    revision
) {

    var lastRow = dataSheet.getLastRow();

    if (lastRow < 2) {
        return [];
    }

    var chunkSize = 500;
    var blockLastRow = 0;
    var blockFirstRow = 0;
    var cursor = lastRow;

    while (cursor >= 2) {

        var chunkFirstRow = Math.max(
            2,
            cursor - chunkSize + 1
        );

        var revisionValues = dataSheet
            .getRange(
                chunkFirstRow,
                1,
                cursor - chunkFirstRow + 1,
                1
            )
            .getValues();

        for (
            var index = revisionValues.length - 1;
            index >= 0;
            index -= 1
        ) {

            var rowNumber =
                chunkFirstRow + index;
            var rowRevision = Number(
                revisionValues[index][0]
            );

            if (rowRevision === revision) {
                if (blockLastRow === 0) {
                    blockLastRow = rowNumber;
                }
                blockFirstRow = rowNumber;
                continue;
            }

            if (blockFirstRow !== 0) {
                return dataSheet
                    .getRange(
                        blockFirstRow,
                        1,
                        blockLastRow -
                            blockFirstRow + 1,
                        6
                    )
                    .getValues();
            }

        }

        cursor = chunkFirstRow - 1;

    }

    if (blockFirstRow === 0) {
        return [];
    }

    return dataSheet
        .getRange(
            blockFirstRow,
            1,
            blockLastRow - blockFirstRow + 1,
            6
        )
        .getValues();

}

function getRecentRevisionRows_(
    dataSheet,
    currentRevision,
    revisionsToKeep
) {

    var rows = [];
    var firstRevision = Math.max(
        1,
        currentRevision - revisionsToKeep + 1
    );

    for (
        var revision = firstRevision;
        revision <= currentRevision;
        revision += 1
    ) {
        rows = rows.concat(
            getRevisionRows_(
                dataSheet,
                revision
            )
        );
    }

    return rows;

}

function createCompactionBackup_(
    currentRevision,
    currentRows,
    exportedAt
) {

    var backup = {
        format:
            TASK_ENGINE_SETTINGS.BACKUP_FORMAT,
        version:
            TASK_ENGINE_SETTINGS.BACKUP_VERSION,
        exportedAt:
            exportedAt ||
            new Date().toISOString(),
        data: rowsToSnapshotData_(currentRows)
    };

    validateSnapshot_(backup);

    var timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-");
    var name =
        "task-engine-compaction-backup-rev-" +
        currentRevision +
        "-" + timestamp + ".json";

    var file = DriveApp.createFile(
        name,
        JSON.stringify(backup),
        "application/json"
    );

    return {
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl()
    };

}

function compactTaskEngineStorage_(force) {

    var lock = LockService.getScriptLock();

    if (!lock.tryLock(20000)) {
        throw protocolError_(
            "SERVER_BUSY",
            "El almacenamiento está ocupado. Intentá nuevamente."
        );
    }

    var spreadsheet = null;
    var temporarySheet = null;
    var originalSheet = null;
    var originalName = "";
    var replacementActivated = false;

    try {

        spreadsheet = getSpreadsheet_();
        var storage = ensureStorage_(spreadsheet);
        originalSheet = storage.dataSheet;
        var originalRows = originalSheet
            .getLastRow();

        if (
            !force &&
            originalRows <=
                TASK_ENGINE_SETTINGS
                    .COMPACTION_MAX_ROWS
        ) {
            return {
                compacted: false,
                reason: "BELOW_THRESHOLD",
                rows: originalRows
            };
        }

        var currentRevision =
            getRevision_(storage.metaSheet);

        if (currentRevision === 0) {
            return {
                compacted: false,
                reason: "EMPTY_STORAGE",
                rows: originalRows
            };
        }

        var currentRows = getRevisionRows_(
            originalSheet,
            currentRevision
        );

        if (currentRows.length === 0) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "No se encontró la revisión activa antes de compactar."
            );
        }

        var backup = createCompactionBackup_(
            currentRevision,
            currentRows,
            storage.metaSheet
                .getRange(2, 2)
                .getDisplayValue()
        );
        var retainedRows =
            getRecentRevisionRows_(
                originalSheet,
                currentRevision,
                TASK_ENGINE_SETTINGS
                    .COMPACTION_REVISIONS_TO_KEEP
            );

        var suffix = String(Date.now());
        var temporaryName =
            "TaskEngineData_compacting_" +
            suffix;
        originalName =
            "TaskEngineData_previous_" +
            suffix;

        temporarySheet =
            spreadsheet.insertSheet(
                temporaryName
            );
        var outputRows = [[
            "revision",
            "type",
            "id",
            "version",
            "updatedAt",
            "payload"
        ]].concat(retainedRows);

        temporarySheet
            .getRange(
                1,
                1,
                outputRows.length,
                6
            )
            .setValues(outputRows);
        temporarySheet.setFrozenRows(1);

        var verificationRows =
            getRevisionRows_(
                temporarySheet,
                currentRevision
            );

        if (
            verificationRows.length !==
                currentRows.length ||
            JSON.stringify(
                rowsToSnapshotData_(
                    verificationRows
                )
            ) !== JSON.stringify(
                rowsToSnapshotData_(
                    currentRows
                )
            )
        ) {
            throw protocolError_(
                "COMPACTION_FAILED",
                "La revisión activa no superó la verificación de compactación."
            );
        }

        originalSheet.setName(originalName);
        temporarySheet.setName(
            TASK_ENGINE_SETTINGS.DATA_SHEET
        );
        replacementActivated = true;
        SpreadsheetApp.flush();

        var previousSheetRetained = false;

        try {
            spreadsheet.deleteSheet(originalSheet);
        } catch (error) {
            previousSheetRetained = true;
            console.warn(
                "La hoja anterior quedó conservada como " +
                originalName + "."
            );
        }

        return {
            compacted: true,
            revision: currentRevision,
            rowsBefore: originalRows,
            rowsAfter: outputRows.length,
            revisionsKept:
                TASK_ENGINE_SETTINGS
                    .COMPACTION_REVISIONS_TO_KEEP,
            backup: backup,
            previousSheetRetained:
                previousSheetRetained
        };

    } catch (error) {

        if (
            originalSheet &&
            originalName &&
            !spreadsheet.getSheetByName(
                TASK_ENGINE_SETTINGS.DATA_SHEET
            )
        ) {
            originalSheet.setName(
                TASK_ENGINE_SETTINGS.DATA_SHEET
            );
        }

        if (
            temporarySheet &&
            !replacementActivated
        ) {
            try {
                spreadsheet.deleteSheet(
                    temporarySheet
                );
            } catch (cleanupError) {
                console.warn(
                    "No se pudo quitar la hoja temporal de compactación."
                );
            }
        }

        throw error;

    } finally {
        lock.releaseLock();
    }

}

function rowsToSnapshotData_(rows) {

    var collections = {
        tasks: [],
        areas: [],
        contexts: [],
        tags: [],
        goals: [],
        customFilters: [],
        activityEvents: []
    };

    var typeToCollection = {
        task: "tasks",
        area: "areas",
        context: "contexts",
        tag: "tags",
        goal: "goals",
        customFilter: "customFilters",
        activityEvent: "activityEvents"
    };

    var snapshotMeta = null;
    var specialPayloads = {};

    (rows || []).forEach(function(row) {

        var type = String(row[1] || "");

        if (type === "snapshotMeta") {

            try {
                snapshotMeta = JSON.parse(row[5]);
            } catch (error) {
                throw protocolError_(
                    "CORRUPT_REMOTE_DATA",
                    "La hoja contiene metadatos remotos dañados."
                );
            }

            return;

        }

        if (
            type === "taskSortPreferences" ||
            type === "taskFilterPreferences" ||
            type === "projectPinPreferences" ||
            type === "displayPreferences"
        ) {

            try {
                specialPayloads[type] =
                    JSON.parse(row[5]);
            } catch (error) {
                throw protocolError_(
                    "CORRUPT_REMOTE_DATA",
                    "La hoja contiene preferencias remotas dañadas."
                );
            }

            return;

        }

        var collection =
            typeToCollection[type];

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

    var data = {
        tasks: collections.tasks,
        areas: collections.areas,
        contexts: collections.contexts,
        tags: collections.tags,
        goals: collections.goals
    };

    if (
        !snapshotMeta ||
        snapshotMeta.schemaVersion !==
            TASK_ENGINE_SETTINGS
                .SYNC_SCHEMA_VERSION
    ) {
        return data;
    }

    var optionalFields =
        snapshotMeta.optionalFields;

    if (
        !optionalFields ||
        typeof optionalFields !== "object" ||
        Array.isArray(optionalFields)
    ) {
        throw protocolError_(
            "CORRUPT_REMOTE_DATA",
            "La hoja contiene metadatos de persistencia inválidos."
        );
    }

    if (optionalFields.customFilters === true) {
        data.customFilters =
            collections.customFilters;
    }

    if (optionalFields.activityEvents === true) {
        data.activityEvents =
            collections.activityEvents;
    }

    if (
        optionalFields.taskSortPreferences === true
    ) {

        if (
            !hasOwn_(
                specialPayloads,
                "taskSortPreferences"
            )
        ) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "Faltan preferencias de orden en la revisión remota."
            );
        }

        try {
            validateTaskSortPreferences_(
                specialPayloads
                    .taskSortPreferences
            );
        } catch (error) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "La hoja contiene preferencias de orden inválidas."
            );
        }

        data.taskSortPreferences =
            specialPayloads
                .taskSortPreferences;

    }

    if (
        optionalFields.taskFilterPreferences ===
            true
    ) {

        if (
            !hasOwn_(
                specialPayloads,
                "taskFilterPreferences"
            )
        ) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "Faltan preferencias de filtros en la revisión remota."
            );
        }

        try {
            validateTaskFilterPreferences_(
                specialPayloads
                    .taskFilterPreferences
            );
        } catch (error) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "La hoja contiene preferencias de filtros inválidas."
            );
        }

        data.taskFilterPreferences =
            specialPayloads
                .taskFilterPreferences;

    }

    if (
        optionalFields.projectPinPreferences ===
            true
    ) {

        if (
            !hasOwn_(
                specialPayloads,
                "projectPinPreferences"
            )
        ) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "Faltan proyectos anclados en la revisión remota."
            );
        }

        try {
            validateProjectPinPreferences_(
                specialPayloads
                    .projectPinPreferences
            );
        } catch (error) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "La hoja contiene proyectos anclados inválidos."
            );
        }

        data.projectPinPreferences =
            specialPayloads
                .projectPinPreferences;

    }

    if (
        optionalFields.displayPreferences === true
    ) {

        if (
            !hasOwn_(
                specialPayloads,
                "displayPreferences"
            )
        ) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "Faltan preferencias de visualización en la revisión remota."
            );
        }

        try {
            validateDisplayPreferences_(
                specialPayloads
                    .displayPreferences
            );
        } catch (error) {
            throw protocolError_(
                "CORRUPT_REMOTE_DATA",
                "La hoja contiene preferencias de visualización inválidas."
            );
        }

        data.displayPreferences =
            specialPayloads
                .displayPreferences;

    }

    return data;

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
        ["tags", "tag"],
        ["goals", "goal"]
    ];

    if (
        hasOwn_(snapshot.data, "customFilters")
    ) {
        definitions.push([
            "customFilters",
            "customFilter"
        ]);
    }

    if (
        hasOwn_(snapshot.data, "activityEvents")
    ) {
        definitions.push([
            "activityEvents",
            "activityEvent"
        ]);
    }

    var rows = [];

    definitions.forEach(function(definition) {

        var collectionName = definition[0];
        var type = definition[1];

        snapshot.data[collectionName]
            .forEach(function(entity) {

                var payload =
                    JSON.stringify(entity);

                assertPayloadSize_(payload);

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

    var optionalFields = {
        customFilters:
            hasOwn_(
                snapshot.data,
                "customFilters"
            ),
        activityEvents:
            hasOwn_(
                snapshot.data,
                "activityEvents"
            ),
        taskSortPreferences:
            hasOwn_(
                snapshot.data,
                "taskSortPreferences"
            ),
        taskFilterPreferences:
            hasOwn_(
                snapshot.data,
                "taskFilterPreferences"
            ),
        projectPinPreferences:
            hasOwn_(
                snapshot.data,
                "projectPinPreferences"
            ),
        displayPreferences:
            hasOwn_(
                snapshot.data,
                "displayPreferences"
            )
    };

    var hasOptionalFields =
        optionalFields.customFilters ||
        optionalFields.activityEvents ||
        optionalFields.taskSortPreferences ||
        optionalFields.taskFilterPreferences ||
        optionalFields.projectPinPreferences ||
        optionalFields.displayPreferences;

    if (hasOptionalFields) {

        var metaPayload = JSON.stringify({
            schemaVersion:
                TASK_ENGINE_SETTINGS
                    .SYNC_SCHEMA_VERSION,
            optionalFields: optionalFields
        });

        assertPayloadSize_(metaPayload);

        rows.push([
            revision,
            "snapshotMeta",
            "sync-state",
            TASK_ENGINE_SETTINGS
                .SYNC_SCHEMA_VERSION,
            "",
            metaPayload
        ]);

    }

    if (optionalFields.taskSortPreferences) {

        var sortPayload = JSON.stringify(
            snapshot.data.taskSortPreferences
        );

        assertPayloadSize_(sortPayload);

        rows.push([
            revision,
            "taskSortPreferences",
            "preferences",
            TASK_ENGINE_SETTINGS
                .SYNC_SCHEMA_VERSION,
            "",
            sortPayload
        ]);

    }

    if (optionalFields.taskFilterPreferences) {

        var filterPayload = JSON.stringify(
            snapshot.data.taskFilterPreferences
        );

        assertPayloadSize_(filterPayload);

        rows.push([
            revision,
            "taskFilterPreferences",
            "preferences",
            TASK_ENGINE_SETTINGS
                .SYNC_SCHEMA_VERSION,
            "",
            filterPayload
        ]);

    }

    if (optionalFields.projectPinPreferences) {

        var projectPinPayload = JSON.stringify(
            snapshot.data.projectPinPreferences
        );

        assertPayloadSize_(projectPinPayload);

        rows.push([
            revision,
            "projectPinPreferences",
            "preferences",
            TASK_ENGINE_SETTINGS
                .SYNC_SCHEMA_VERSION,
            "",
            projectPinPayload
        ]);

    }

    if (optionalFields.displayPreferences) {

        var displayPayload = JSON.stringify(
            snapshot.data.displayPreferences
        );

        assertPayloadSize_(displayPayload);

        rows.push([
            revision,
            "displayPreferences",
            "preferences",
            TASK_ENGINE_SETTINGS
                .SYNC_SCHEMA_VERSION,
            "",
            displayPayload
        ]);

    }

    return rows;

}

function assertPayloadSize_(payload) {

    if (
        payload.length >
        TASK_ENGINE_SETTINGS
            .MAX_PAYLOAD_LENGTH
    ) {
        throw protocolError_(
            "ENTITY_TOO_LARGE",
            "Un dato supera el tamaño permitido por Google Sheets."
        );
    }

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
        "tags",
        "goals"
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

        idsByCollection[name] =
            validateEntityCollection_(
                collection,
                name
            );

    });

    if (
        hasOwn_(snapshot.data, "customFilters")
    ) {

        if (
            !Array.isArray(
                snapshot.data.customFilters
            )
        ) {
            throw protocolError_(
                "INVALID_SNAPSHOT",
                "La copia contiene filtros personalizados inválidos."
            );
        }

        validateEntityCollection_(
            snapshot.data.customFilters,
            "customFilters"
        );

    }

    if (
        hasOwn_(snapshot.data, "activityEvents")
    ) {

        if (
            !Array.isArray(
                snapshot.data.activityEvents
            )
        ) {
            throw protocolError_(
                "INVALID_SNAPSHOT",
                "La copia contiene actividades inválidas."
            );
        }

        validateEntityCollection_(
            snapshot.data.activityEvents,
            "activityEvents"
        );

    }

    if (
        hasOwn_(
            snapshot.data,
            "taskSortPreferences"
        )
    ) {
        validateTaskSortPreferences_(
            snapshot.data.taskSortPreferences
        );
    }

    if (
        hasOwn_(
            snapshot.data,
            "taskFilterPreferences"
        )
    ) {
        validateTaskFilterPreferences_(
            snapshot.data.taskFilterPreferences
        );
    }

    if (
        hasOwn_(
            snapshot.data,
            "projectPinPreferences"
        )
    ) {
        validateProjectPinPreferences_(
            snapshot.data.projectPinPreferences
        );
    }

    if (
        hasOwn_(
            snapshot.data,
            "displayPreferences"
        )
    ) {
        validateDisplayPreferences_(
            snapshot.data.displayPreferences
        );
    }

    validateTaskReferences_(
        snapshot.data.tasks,
        idsByCollection
    );

    validateGoalReferences_(
        snapshot.data.goals,
        idsByCollection
    );

}

function validateEntityCollection_(
    collection,
    collectionName
) {

    var ids = {};

    collection.forEach(function(entity) {

        validateEntity_(
            entity,
            collectionName
        );

        if (ids[entity.id]) {
            throw protocolError_(
                "DUPLICATE_ID",
                "La copia contiene identificadores duplicados."
            );
        }

        ids[entity.id] = true;

    });

    return ids;

}

function validateTaskSortPreferences_(
    preferences
) {

    if (
        !preferences ||
        typeof preferences !== "object" ||
        Array.isArray(preferences)
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia contiene preferencias de orden inválidas."
        );
    }

    var validSorts = {
        MANUAL: true,
        DUE_DATE: true,
        PRIORITY: true,
        CREATED_NEWEST: true,
        CREATED_OLDEST: true
    };

    Object.keys(preferences)
        .forEach(function(viewKey) {

            if (
                !viewKey.trim() ||
                !validSorts[preferences[viewKey]]
            ) {
                throw protocolError_(
                    "INVALID_SNAPSHOT",
                    "La copia contiene una preferencia de orden inválida."
                );
            }

        });

}

function validateTaskFilterPreferences_(
    preferences
) {

    if (
        !preferences ||
        typeof preferences !== "object" ||
        Array.isArray(preferences)
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia contiene preferencias de filtros inválidas."
        );
    }

    var filterKeys = [
        "areaId",
        "contextId",
        "tagId",
        "priority",
        "due"
    ];

    Object.keys(preferences)
        .forEach(function(viewKey) {

            var filters = preferences[viewKey];

            if (
                !viewKey.trim() ||
                !filters ||
                typeof filters !== "object" ||
                Array.isArray(filters)
            ) {
                throw protocolError_(
                    "INVALID_SNAPSHOT",
                    "La copia contiene una preferencia de filtros inválida."
                );
            }

            filterKeys.forEach(function(key) {

                if (
                    typeof filters[key] !==
                        "string"
                ) {
                    throw protocolError_(
                        "INVALID_SNAPSHOT",
                        "La copia contiene una preferencia de filtros incompleta."
                    );
                }

            });

        });

}

function validateProjectPinPreferences_(
    preferences
) {

    if (
        !preferences ||
        typeof preferences !== "object" ||
        Array.isArray(preferences)
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia contiene proyectos anclados inválidos."
        );
    }

    Object.keys(preferences)
        .forEach(function(projectId) {

            if (
                !projectId.trim() ||
                preferences[projectId] !== true
            ) {
                throw protocolError_(
                    "INVALID_SNAPSHOT",
                    "La copia contiene un proyecto anclado inválido."
                );
            }

        });

}

function validateDisplayPreferences_(
    preferences
) {

    if (
        !preferences ||
        typeof preferences !== "object" ||
        Array.isArray(preferences)
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia contiene preferencias de visualización inválidas."
        );
    }

    if (
        hasOwn_(preferences, "sidebarTitle") &&
        (
            typeof preferences.sidebarTitle !==
                "string" ||
            preferences.sidebarTitle.trim().length >
                40
        )
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia contiene un título lateral inválido."
        );
    }

    if (
        hasOwn_(preferences, "theme") &&
        (
            typeof preferences.theme !== "string" ||
            !preferences.theme.trim() ||
            preferences.theme.trim().length > 64
        )
    ) {
        throw protocolError_(
            "INVALID_SNAPSHOT",
            "La copia contiene un tema visual inválido."
        );
    }

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

        validateTaskAttachments_(
            task.attachments
        );

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

        var taskGoalIds =
            task.goalIds || [];

        if (!Array.isArray(taskGoalIds)) {
            throw protocolError_(
                "INVALID_REFERENCE",
                "Una tarea contiene objetivos inválidos."
            );
        }

        taskGoalIds.forEach(function(goalId) {

            if (!ids.goals[goalId]) {
                throw protocolError_(
                    "INVALID_REFERENCE",
                    "Una tarea referencia un objetivo inexistente."
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

function validateTaskAttachments_(attachments) {

    if (attachments === undefined) return;

    if (
        !Array.isArray(attachments) ||
        attachments.length > 10
    ) {
        throw protocolError_(
            "INVALID_ATTACHMENT",
            "Una tarea contiene adjuntos inválidos."
        );
    }

    var ids = {};
    var driveFileIds = {};

    attachments.forEach(function(attachment) {

        var valid =
            attachment &&
            typeof attachment.id === "string" &&
            /^[A-Za-z0-9_-]+$/.test(
                attachment.id
            ) &&
            typeof attachment.driveFileId ===
                "string" &&
            /^[A-Za-z0-9_-]+$/.test(
                attachment.driveFileId
            ) &&
            typeof attachment.name === "string" &&
            attachment.name.trim().length > 0 &&
            attachment.name.length <=
                TASK_ENGINE_SETTINGS
                    .MAX_ATTACHMENT_NAME_LENGTH &&
            typeof attachment.mimeType ===
                "string" &&
            attachment.mimeType.length > 0 &&
            attachment.mimeType.length <= 160 &&
            Number.isInteger(attachment.size) &&
            attachment.size > 0 &&
            attachment.size <=
                TASK_ENGINE_SETTINGS
                    .MAX_ATTACHMENT_BYTES &&
            typeof attachment.url === "string" &&
            /^https:\/\/drive\.google\.com\//
                .test(attachment.url) &&
            typeof attachment.createdAt ===
                "string" &&
            !Number.isNaN(
                Date.parse(attachment.createdAt)
            );

        if (
            !valid ||
            ids[attachment.id] ||
            driveFileIds[
                attachment.driveFileId
            ]
        ) {
            throw protocolError_(
                "INVALID_ATTACHMENT",
                "Una tarea contiene adjuntos inválidos."
            );
        }

        ids[attachment.id] = true;
        driveFileIds[
            attachment.driveFileId
        ] = true;

    });

}

function validateGoalReferences_(
    goals,
    ids
) {

    var validStatuses = {
        ACTIVE: true,
        COMPLETED: true,
        ARCHIVED: true,
        DELETED: true
    };

    goals.forEach(function(goal) {

        if (!validStatuses[goal.status]) {
            throw protocolError_(
                "INVALID_GOAL_STATUS",
                "Un objetivo contiene un estado inválido."
            );
        }

        if (
            goal.parentGoalId &&
            !ids.goals[goal.parentGoalId]
        ) {
            throw protocolError_(
                "INVALID_REFERENCE",
                "Un objetivo referencia un objetivo padre inexistente."
            );
        }

    });

    var goalsById = {};

    goals.forEach(function(goal) {
        goalsById[goal.id] = goal;
    });

    goals.forEach(function(goal) {

        var visited = {};
        var current = goal;

        while (current && current.parentGoalId) {

            if (visited[current.id]) {
                throw protocolError_(
                    "INVALID_GOAL_TREE",
                    "La jerarquía de objetivos contiene un ciclo."
                );
            }

            visited[current.id] = true;

            current =
                goalsById[current.parentGoalId];

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
