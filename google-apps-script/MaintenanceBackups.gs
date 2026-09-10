var TASK_ENGINE_BACKUP_SETTINGS = Object.freeze({
    ROOT_FOLDER_NAME: "Mantenimiento y respaldos",
    AUTOMATIC_FOLDER_NAME: "Automáticos",
    MONTHLY_FOLDER_NAME: "Mensuales",
    COMPACTION_FOLDER_NAME: "Previos a compactación",
    DIAGNOSTICS_FOLDER_NAME: "Diagnósticos",
    MANUAL_FOLDER_NAME: "Manuales",
    AUTOMATIC_RETENTION: 45,
    MONTHLY_RETENTION: 12,
    COMPACTION_RETENTION: 20,
    DIAGNOSTIC_RETENTION: 90
});

function runTaskEngineBackupCycle_() {

    var loaded = loadSnapshot_();

    if (!loaded.data) {
        return {
            created: false,
            reason: "EMPTY_STORAGE",
            revision: 0,
            automatic: null,
            monthly: null
        };
    }

    var now = new Date();
    var automatic = createTaskEngineBackupFile_(
        loaded.data,
        loaded.revision,
        "AUTOMATIC",
        now
    );
    var monthly = null;

    if (shouldCreateTaskEngineMonthlyBackup_(now)) {
        monthly = createTaskEngineBackupFile_(
            loaded.data,
            loaded.revision,
            "MONTHLY",
            now
        );
    }

    return {
        created: true,
        revision: loaded.revision,
        automatic: automatic,
        monthly: monthly
    };

}

function shouldCreateTaskEngineMonthlyBackup_(date) {

    return Utilities.formatDate(
        date,
        Session.getScriptTimeZone(),
        "dd"
    ) === "01";

}

function createTaskEngineManualBackup() {

    var loaded = loadSnapshot_();

    if (!loaded.data) {
        return {
            created: false,
            reason: "EMPTY_STORAGE",
            revision: 0
        };
    }

    return createTaskEngineBackupFile_(
        loaded.data,
        loaded.revision,
        "MANUAL",
        new Date()
    );

}

function inspectTaskEngineBackup(fileId) {

    var file = DriveApp.getFileById(
        requireDriveFileId_(fileId)
    );
    var content = file.getBlob()
        .getDataAsString("UTF-8");
    var inspection = inspectTaskEngineBackupContent_(
        content
    );

    return {
        valid: true,
        fileId: file.getId(),
        fileName: file.getName(),
        exportedAt: inspection.snapshot.exportedAt,
        bytes: content.length,
        counts: inspection.counts
    };

}

function restoreTaskEngineBackupFromDrive(fileId) {

    var file = DriveApp.getFileById(
        requireDriveFileId_(fileId)
    );
    var content = file.getBlob()
        .getDataAsString("UTF-8");
    var inspection = inspectTaskEngineBackupContent_(
        content
    );
    var current = loadSnapshot_();
    var safetyBackup = current.data
        ? createTaskEngineBackupFile_(
            current.data,
            current.revision,
            "MANUAL",
            new Date(),
            "antes-de-restaurar"
        )
        : null;
    var saved = saveSnapshot_(
        inspection.snapshot,
        current.revision
    );

    return {
        restored: true,
        sourceFileId: file.getId(),
        sourceFileName: file.getName(),
        previousRevision: current.revision,
        revision: saved.revision,
        safetyBackup: safetyBackup,
        counts: inspection.counts
    };

}

function createTaskEngineBackupFile_(
    snapshot,
    revision,
    kind,
    now,
    suffix
) {

    validateSnapshot_(snapshot);

    var serialized = JSON.stringify(snapshot);
    var inspection = inspectTaskEngineBackupContent_(
        serialized
    );
    var folder = getTaskEngineBackupFolder_(kind);
    var definition = getTaskEngineBackupDefinition_(
        kind
    );
    var datePart = formatBackupDate_(now);
    var name = definition.prefix + datePart +
        "-rev-" + revision +
        (suffix ? "-" + suffix : "") +
        ".json";
    var existing = folder.getFilesByName(name);
    var file = existing.hasNext()
        ? existing.next()
        : folder.createFile(
            name,
            serialized,
            "application/json"
        );
    var storedContent = file.getBlob()
        .getDataAsString("UTF-8");

    inspectTaskEngineBackupContent_(storedContent);

    if (storedContent !== serialized) {
        throw protocolError_(
            "BACKUP_VERIFICATION_FAILED",
            "La copia creada no coincide con los datos originales."
        );
    }

    var rotated = rotateTaskEngineBackupFiles_(
        folder,
        definition.prefix,
        definition.retention
    );

    return {
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl(),
        revision: revision,
        bytes: storedContent.length,
        counts: inspection.counts,
        verified: true,
        movedToTrashByRotation: rotated
    };

}

function recordTaskEngineMaintenanceDiagnostic_(
    diagnostic
) {

    try {
        var folder = getTaskEngineBackupFolder_(
            "DIAGNOSTIC"
        );
        var now = new Date();
        var name = "task-engine-diagnostic-" +
            formatBackupTimestamp_(now) +
            ".json";
        var content = JSON.stringify({
            format: "task-engine-v2-maintenance-diagnostic",
            version: 1,
            createdAt: now.toISOString(),
            spreadsheetId: getSpreadsheet_().getId(),
            spreadsheetName: getSpreadsheet_().getName(),
            triggers:
                inspectTaskEngineMaintenanceTriggers_(),
            result: diagnostic
        }, null, 2);

        var file = folder.createFile(
            name,
            content,
            "application/json"
        );

        rotateTaskEngineBackupFiles_(
            folder,
            "task-engine-diagnostic-",
            TASK_ENGINE_BACKUP_SETTINGS
                .DIAGNOSTIC_RETENTION
        );

        return {
            recorded: true,
            id: file.getId(),
            name: file.getName(),
            url: file.getUrl()
        };
    } catch (error) {
        console.warn(
            "No se pudo guardar el diagnóstico de mantenimiento: " +
            error.message
        );
        return {
            recorded: false,
            error: error.message
        };
    }

}

function inspectTaskEngineMaintenanceTriggers_() {

    if (
        typeof ScriptApp === "undefined" ||
        typeof ScriptApp.getProjectTriggers !==
            "function"
    ) {
        return [];
    }

    return ScriptApp.getProjectTriggers()
        .map(function(trigger) {
            return {
                handler:
                    trigger.getHandlerFunction(),
                eventType: String(
                    trigger.getEventType()
                ),
                source: String(
                    trigger.getTriggerSource()
                )
            };
        });

}

function inspectTaskEngineBackupContent_(content) {

    var snapshot;

    try {
        snapshot = JSON.parse(content);
    } catch (error) {
        throw protocolError_(
            "INVALID_BACKUP_JSON",
            "El respaldo no contiene JSON válido."
        );
    }

    validateSnapshot_(snapshot);

    return {
        snapshot: snapshot,
        counts: countTaskEngineSnapshot_(snapshot)
    };

}

function countTaskEngineSnapshot_(snapshot) {

    var data = snapshot.data || {};
    var names = [
        "tasks",
        "areas",
        "contexts",
        "tags",
        "goals",
        "activityEvents"
    ];
    var counts = {};

    names.forEach(function(name) {
        counts[name] = Array.isArray(data[name])
            ? data[name].length
            : 0;
    });

    return counts;

}

function getTaskEngineBackupFolder_(kind) {

    var spreadsheet = getSpreadsheet_();
    var spreadsheetFile = DriveApp.getFileById(
        spreadsheet.getId()
    );
    var parents = spreadsheetFile.getParents();

    if (!parents.hasNext()) {
        throw protocolError_(
            "BACKUP_FOLDER_NOT_FOUND",
            "La base debe estar dentro de una carpeta de Google Drive."
        );
    }

    var taskEngineFolder = parents.next();
    var root = getOrCreateTaskEngineFolder_(
        taskEngineFolder,
        TASK_ENGINE_BACKUP_SETTINGS.ROOT_FOLDER_NAME
    );
    var installationName = spreadsheet.getName() +
        " — " + spreadsheet.getId().slice(0, 8);
    var installation = getOrCreateTaskEngineFolder_(
        root,
        installationName
    );
    var definition = getTaskEngineBackupDefinition_(
        kind
    );

    return getOrCreateTaskEngineFolder_(
        installation,
        definition.folderName
    );

}

function getOrCreateTaskEngineFolder_(parent, name) {

    var folders = parent.getFoldersByName(name);

    return folders.hasNext()
        ? folders.next()
        : parent.createFolder(name);

}

function getTaskEngineBackupDefinition_(kind) {

    var definitions = {
        AUTOMATIC: {
            folderName:
                TASK_ENGINE_BACKUP_SETTINGS
                    .AUTOMATIC_FOLDER_NAME,
            prefix: "task-engine-auto-",
            retention:
                TASK_ENGINE_BACKUP_SETTINGS
                    .AUTOMATIC_RETENTION
        },
        MONTHLY: {
            folderName:
                TASK_ENGINE_BACKUP_SETTINGS
                    .MONTHLY_FOLDER_NAME,
            prefix: "task-engine-monthly-",
            retention:
                TASK_ENGINE_BACKUP_SETTINGS
                    .MONTHLY_RETENTION
        },
        COMPACTION: {
            folderName:
                TASK_ENGINE_BACKUP_SETTINGS
                    .COMPACTION_FOLDER_NAME,
            prefix: "task-engine-compaction-backup-",
            retention:
                TASK_ENGINE_BACKUP_SETTINGS
                    .COMPACTION_RETENTION
        },
        DIAGNOSTIC: {
            folderName:
                TASK_ENGINE_BACKUP_SETTINGS
                    .DIAGNOSTICS_FOLDER_NAME,
            prefix: "task-engine-diagnostic-",
            retention:
                TASK_ENGINE_BACKUP_SETTINGS
                    .DIAGNOSTIC_RETENTION
        },
        MANUAL: {
            folderName:
                TASK_ENGINE_BACKUP_SETTINGS
                    .MANUAL_FOLDER_NAME,
            prefix: "task-engine-manual-",
            retention: Number.MAX_SAFE_INTEGER
        }
    };

    if (!definitions[kind]) {
        throw new Error("Unknown backup kind: " + kind);
    }

    return definitions[kind];

}

function rotateTaskEngineBackupFiles_(
    folder,
    prefix,
    retention
) {

    var iterator = folder.getFiles();
    var files = [];

    while (iterator.hasNext()) {
        var file = iterator.next();
        if (file.getName().indexOf(prefix) === 0) {
            files.push(file);
        }
    }

    files.sort(function(first, second) {
        return second.getDateCreated().getTime() -
            first.getDateCreated().getTime();
    });

    var movedToTrash = 0;

    files.slice(retention).forEach(function(file) {
        file.setTrashed(true);
        movedToTrash += 1;
    });

    return movedToTrash;

}

function requireDriveFileId_(fileId) {

    var value = String(fileId || "").trim();

    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
        throw protocolError_(
            "INVALID_BACKUP_FILE_ID",
            "El identificador del respaldo no es válido."
        );
    }

    return value;

}

function formatBackupDate_(date) {

    return Utilities.formatDate(
        date,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
    );

}

function formatBackupTimestamp_(date) {

    return Utilities.formatDate(
        date,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd-HH-mm-ss"
    );

}
