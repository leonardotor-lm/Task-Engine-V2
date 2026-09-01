var TASK_ENGINE_GPT_SETTINGS = Object.freeze({
    MAX_RESULTS: 100,
    DEFAULT_RESULTS: 40,
    IDEMPOTENCY_SECONDS: 21600
});

function gptGetContext_() {

    var loaded = loadSnapshot_();
    var data = gptRequireSnapshotData_(loaded);
    var counts = {};

    data.tasks.forEach(function(task) {
        counts[task.status] =
            (counts[task.status] || 0) + 1;
    });

    return {
        ok: true,
        revision: loaded.revision,
        counts: counts,
        areas: gptPublicEntities_(data.areas),
        contexts: gptPublicEntities_(data.contexts),
        tags: gptPublicEntities_(data.tags),
        goals: (data.goals || []).map(function(goal) {
            return {
                id: goal.id,
                title: goal.title,
                status: goal.status,
                parentGoalId: goal.parentGoalId || null
            };
        })
    };

}

function gptSearchTasks_(input) {

    gptAssertPlainObject_(input, "INVALID_INPUT");

    var loaded = loadSnapshot_();
    var data = gptRequireSnapshotData_(loaded);
    var tasks = data.tasks.filter(function(task) {
        return gptTaskMatches_(task, input);
    });

    tasks.sort(function(first, second) {
        return String(second.updatedAt || "")
            .localeCompare(
                String(first.updatedAt || "")
            );
    });

    var offset = gptBoundedInteger_(
        input.offset,
        0,
        100000,
        0
    );
    var limit = gptBoundedInteger_(
        input.limit,
        1,
        TASK_ENGINE_GPT_SETTINGS.MAX_RESULTS,
        TASK_ENGINE_GPT_SETTINGS.DEFAULT_RESULTS
    );
    var page = tasks.slice(offset, offset + limit);

    return {
        ok: true,
        revision: loaded.revision,
        total: tasks.length,
        offset: offset,
        nextOffset:
            offset + page.length < tasks.length
                ? offset + page.length
                : null,
        tasks: page.map(gptPublicTask_)
    };

}

function gptGetTask_(input) {

    gptAssertPlainObject_(input, "INVALID_INPUT");

    var loaded = loadSnapshot_();
    var data = gptRequireSnapshotData_(loaded);
    var task = gptFindTask_(
        data.tasks,
        input.taskId
    );

    return {
        ok: true,
        revision: loaded.revision,
        task: gptPublicTask_(task)
    };

}

function gptCreateTask_(input) {

    return gptWithIdempotency_(
        "create",
        input,
        function() {

            var loaded = loadSnapshot_();
            var snapshot = gptRequireSnapshot_(loaded);
            var data = snapshot.data;
            var now = new Date().toISOString();
            var title = gptRequiredText_(
                input.title,
                300,
                "El título es obligatorio."
            );
            var areaId = gptNullableId_(input.areaId);
            var task = {
                id: Utilities.getUuid(),
                title: title,
                description: gptOptionalText_(
                    input.description,
                    10000,
                    ""
                ),
                status: areaId ? "PENDING" : "INBOX",
                statusBeforeDelete: null,
                statusBeforeCompletion: null,
                isWaitingBeforeCompletion: null,
                areaId: areaId,
                contextId:
                    gptNullableId_(input.contextId),
                priority:
                    gptPriority_(input.priority, 0),
                tagIds: gptIdArray_(input.tagIds),
                goalIds: gptIdArray_(input.goalIds),
                attachments: [],
                notionPageId: null,
                notionPageUrl: null,
                isWaiting: input.isWaiting === true,
                isProject: false,
                parentTaskId: null,
                recurrenceId: null,
                recurrence: null,
                recurrenceInterval: 1,
                recurrenceWeekdays: [],
                reminder: null,
                manualOrder: 0,
                version: 1,
                createdAt: now,
                updatedAt: now,
                completedAt: null,
                startDate:
                    gptNullableDate_(input.startDate),
                dueDate:
                    gptNullableDate_(input.dueDate),
                dueTime:
                    gptNullableTime_(input.dueTime),
                postponements: []
            };

            gptValidateTaskDates_(task);
            data.tasks.push(task);
            gptAddActivity_(
                data,
                "TASK_CREATED",
                task,
                "Creaste la tarea desde ChatGPT"
            );

            var saved = saveSnapshot_(
                snapshot,
                loaded.revision
            );

            return {
                ok: true,
                revision: saved.revision,
                task: gptPublicTask_(task)
            };

        }
    );

}

function gptUpdateTask_(input) {

    return gptWithIdempotency_(
        "update",
        input,
        function() {

            var loaded = loadSnapshot_();
            var snapshot = gptRequireSnapshot_(loaded);
            var data = snapshot.data;
            var task = gptFindTask_(
                data.tasks,
                input.taskId
            );

            gptAssertExpectedVersion_(
                task,
                input.expectedVersion
            );

            if (
                task.status !== "INBOX" &&
                task.status !== "PENDING"
            ) {
                throw protocolError_(
                    "TASK_NOT_ACTIVE",
                    "Sólo se puede editar una tarea activa desde ChatGPT."
                );
            }

            var changes = input.changes;
            gptAssertPlainObject_(
                changes,
                "INVALID_CHANGES"
            );
            gptApplyAllowedChanges_(task, changes);
            task.version += 1;
            task.updatedAt = new Date().toISOString();

            gptAddActivity_(
                data,
                "TASK_UPDATED",
                task,
                "Editaste la tarea desde ChatGPT"
            );

            var saved = saveSnapshot_(
                snapshot,
                loaded.revision
            );

            return {
                ok: true,
                revision: saved.revision,
                task: gptPublicTask_(task)
            };

        }
    );

}

function gptCompleteTask_(input) {

    return gptWithIdempotency_(
        "complete",
        input,
        function() {

            var loaded = loadSnapshot_();
            var snapshot = gptRequireSnapshot_(loaded);
            var data = snapshot.data;
            var task = gptFindTask_(
                data.tasks,
                input.taskId
            );

            gptAssertExpectedVersion_(
                task,
                input.expectedVersion
            );

            if (
                task.status !== "INBOX" &&
                task.status !== "PENDING"
            ) {
                throw protocolError_(
                    "TASK_NOT_ACTIVE",
                    "Sólo se puede completar una tarea activa."
                );
            }

            var now = new Date().toISOString();
            task.statusBeforeCompletion = task.status;
            task.isWaitingBeforeCompletion =
                task.isWaiting === true;
            task.status = "COMPLETED";
            task.isWaiting = false;
            task.completedAt = now;
            task.version += 1;
            task.updatedAt = now;

            gptAddActivity_(
                data,
                "TASK_COMPLETED",
                task,
                "Completaste la tarea desde ChatGPT"
            );

            var saved = saveSnapshot_(
                snapshot,
                loaded.revision
            );

            return {
                ok: true,
                revision: saved.revision,
                task: gptPublicTask_(task)
            };

        }
    );

}

function gptApplyAllowedChanges_(task, changes) {

    var allowed = {
        title: true,
        description: true,
        areaId: true,
        contextId: true,
        priority: true,
        tagIds: true,
        goalIds: true,
        isWaiting: true,
        startDate: true,
        dueDate: true,
        dueTime: true
    };
    var keys = Object.keys(changes);

    if (keys.length === 0) {
        throw protocolError_(
            "EMPTY_CHANGES",
            "No se indicó ningún cambio."
        );
    }

    keys.forEach(function(key) {
        if (!allowed[key]) {
            throw protocolError_(
                "UNSUPPORTED_CHANGE",
                "La propiedad " + key +
                    " no puede modificarse desde ChatGPT."
            );
        }
    });

    if (gptHasOwn_(changes, "title")) {
        task.title = gptRequiredText_(
            changes.title,
            300,
            "El título no puede quedar vacío."
        );
    }
    if (gptHasOwn_(changes, "description")) {
        task.description = gptOptionalText_(
            changes.description,
            10000,
            ""
        );
    }
    if (gptHasOwn_(changes, "areaId")) {
        task.areaId = gptNullableId_(changes.areaId);
        if (task.status === "INBOX" && task.areaId) {
            task.status = "PENDING";
        }
    }
    if (gptHasOwn_(changes, "contextId")) {
        task.contextId =
            gptNullableId_(changes.contextId);
    }
    if (gptHasOwn_(changes, "priority")) {
        task.priority = gptPriority_(changes.priority);
    }
    if (gptHasOwn_(changes, "tagIds")) {
        task.tagIds = gptIdArray_(changes.tagIds);
    }
    if (gptHasOwn_(changes, "goalIds")) {
        task.goalIds = gptIdArray_(changes.goalIds);
    }
    if (gptHasOwn_(changes, "isWaiting")) {
        task.isWaiting = changes.isWaiting === true;
    }
    if (gptHasOwn_(changes, "startDate")) {
        task.startDate =
            gptNullableDate_(changes.startDate);
    }
    if (gptHasOwn_(changes, "dueDate")) {
        task.dueDate =
            gptNullableDate_(changes.dueDate);
        if (!task.dueDate) task.dueTime = null;
    }
    if (gptHasOwn_(changes, "dueTime")) {
        task.dueTime =
            gptNullableTime_(changes.dueTime);
    }

    gptValidateTaskDates_(task);

}

function gptTaskMatches_(task, input) {

    if (input.query) {
        var query = gptNormalizeText_(input.query);
        var haystack = gptNormalizeText_(
            (task.title || "") + " " +
            (task.description || "")
        );
        if (haystack.indexOf(query) === -1) return false;
    }

    if (
        input.status &&
        task.status !== input.status
    ) return false;
    if (
        input.areaId !== undefined &&
        task.areaId !== gptNullableId_(input.areaId)
    ) return false;
    if (
        input.contextId !== undefined &&
        task.contextId !==
            gptNullableId_(input.contextId)
    ) return false;
    if (
        input.priority !== undefined &&
        task.priority !== gptPriority_(input.priority)
    ) return false;
    if (
        input.isWaiting !== undefined &&
        Boolean(task.isWaiting) !==
            (input.isWaiting === true)
    ) return false;
    if (
        input.hasDueDate !== undefined &&
        Boolean(task.dueDate) !==
            (input.hasDueDate === true)
    ) return false;
    if (
        input.tagId &&
        (task.tagIds || []).indexOf(input.tagId) === -1
    ) return false;
    if (
        input.goalId &&
        (task.goalIds || []).indexOf(input.goalId) === -1
    ) return false;
    if (
        input.dueFrom &&
        (!task.dueDate || task.dueDate < input.dueFrom)
    ) return false;
    if (
        input.dueTo &&
        (!task.dueDate || task.dueDate > input.dueTo)
    ) return false;

    return true;

}

function gptRequireSnapshot_(loaded) {

    if (!loaded.data || !loaded.data.data) {
        throw protocolError_(
            "EMPTY_DATABASE",
            "La base de Task Engine todavía está vacía."
        );
    }

    return loaded.data;

}

function gptRequireSnapshotData_(loaded) {
    return gptRequireSnapshot_(loaded).data;
}

function gptFindTask_(tasks, taskId) {

    var id = gptRequiredId_(taskId);
    var task = tasks.find(function(candidate) {
        return candidate.id === id;
    });

    if (!task) {
        throw protocolError_(
            "TASK_NOT_FOUND",
            "No se encontró la tarea solicitada."
        );
    }

    return task;

}

function gptPublicTask_(task) {

    return {
        id: task.id,
        title: task.title,
        description: task.description || "",
        status: task.status,
        areaId: task.areaId || null,
        contextId: task.contextId || null,
        priority: task.priority || 0,
        tagIds: task.tagIds || [],
        goalIds: task.goalIds || [],
        isWaiting: task.isWaiting === true,
        isProject: task.isProject === true,
        parentTaskId: task.parentTaskId || null,
        startDate: task.startDate || null,
        dueDate: task.dueDate || null,
        dueTime: task.dueTime || null,
        completedAt: task.completedAt || null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        version: task.version
    };

}

function gptPublicEntities_(entities) {
    return (entities || []).map(function(entity) {
        return {
            id: entity.id,
            name: entity.name,
            color: entity.color || null
        };
    });
}

function gptAddActivity_(data, type, task, details) {

    if (!Array.isArray(data.activityEvents)) return;

    var now = new Date().toISOString();

    data.activityEvents.push({
        id: Utilities.getUuid(),
        type: type,
        taskId: task.id,
        taskTitle: task.title,
        taskCount: 1,
        details: details,
        createdAt: now,
        updatedAt: now,
        version: 1
    });

}

function gptAssertExpectedVersion_(task, expected) {

    if (
        !Number.isInteger(expected) ||
        expected !== task.version
    ) {
        var error = protocolError_(
            "TASK_VERSION_CONFLICT",
            "La tarea cambió desde que ChatGPT la consultó. Volvé a leerla antes de modificarla."
        );
        error.taskVersion = task.version;
        throw error;
    }

}

function gptWithIdempotency_(operation, input, callback) {

    gptAssertPlainObject_(input, "INVALID_INPUT");

    var requestId = gptRequiredText_(
        input.requestId,
        120,
        "Falta el identificador de la solicitud."
    );
    var digest = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        operation + ":" + requestId
    );
    var cacheKey = "gpt-action-" +
        Utilities.base64EncodeWebSafe(digest)
            .replace(/=+$/, "");
    var cache = CacheService.getScriptCache();
    var cached = cache.get(cacheKey);

    if (cached) return JSON.parse(cached);

    var result = callback();

    cache.put(
        cacheKey,
        JSON.stringify(result),
        TASK_ENGINE_GPT_SETTINGS
            .IDEMPOTENCY_SECONDS
    );

    return result;

}

function gptValidateTaskDates_(task) {

    if (
        task.startDate &&
        task.dueDate &&
        task.startDate > task.dueDate
    ) {
        throw protocolError_(
            "INVALID_DATE_RANGE",
            "La fecha de inicio no puede ser posterior al vencimiento."
        );
    }

    if (task.dueTime && !task.dueDate) {
        throw protocolError_(
            "INVALID_DUE_TIME",
            "La hora necesita una fecha de vencimiento."
        );
    }

}

function gptAssertPlainObject_(value, code) {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        throw protocolError_(
            code,
            "Los datos enviados no son válidos."
        );
    }
}

function gptHasOwn_(object, property) {
    return Object.prototype.hasOwnProperty.call(
        object || {},
        property
    );
}

function gptRequiredText_(value, maximum, message) {
    var text = String(value || "").trim();
    if (!text || text.length > maximum) {
        throw protocolError_("INVALID_INPUT", message);
    }
    return text;
}

function gptOptionalText_(value, maximum, fallback) {
    if (value === undefined || value === null) {
        return fallback;
    }
    var text = String(value);
    if (text.length > maximum) {
        throw protocolError_(
            "INVALID_INPUT",
            "Un texto supera el límite permitido."
        );
    }
    return text;
}

function gptRequiredId_(value) {
    var id = String(value || "").trim();
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
        throw protocolError_(
            "INVALID_ID",
            "El identificador no es válido."
        );
    }
    return id;
}

function gptNullableId_(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    return gptRequiredId_(value);
}

function gptIdArray_(value) {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.length > 50) {
        throw protocolError_(
            "INVALID_IDS",
            "La lista de identificadores no es válida."
        );
    }
    var unique = {};
    return value.map(gptRequiredId_).filter(function(id) {
        if (unique[id]) return false;
        unique[id] = true;
        return true;
    });
}

function gptPriority_(value, fallback) {
    if (value === undefined && fallback !== undefined) {
        return fallback;
    }
    var priority = Number(value);
    if (!Number.isInteger(priority) || priority < 0 || priority > 4) {
        throw protocolError_(
            "INVALID_PRIORITY",
            "La prioridad debe estar entre 0 y 4."
        );
    }
    return priority;
}

function gptNullableDate_(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    var date = String(value);
    var parsed = new Date(date + "T00:00:00.000Z");
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== date
    ) {
        throw protocolError_(
            "INVALID_DATE",
            "La fecha debe existir y usar el formato AAAA-MM-DD."
        );
    }
    return date;
}

function gptNullableTime_(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    var time = String(value);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw protocolError_(
            "INVALID_TIME",
            "La hora debe usar el formato HH:MM."
        );
    }
    return time;
}

function gptBoundedInteger_(value, minimum, maximum, fallback) {
    if (value === undefined || value === null) return fallback;
    var number = Number(value);
    if (
        !Number.isInteger(number) ||
        number < minimum ||
        number > maximum
    ) {
        throw protocolError_(
            "INVALID_NUMBER",
            "Un valor numérico está fuera de rango."
        );
    }
    return number;
}

function gptNormalizeText_(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
