var TASK_ENGINE_NOTION_SETTINGS = Object.freeze({
    TOKEN_PROPERTY: "TASK_ENGINE_NOTION_TOKEN",
    DATA_SOURCE_ID_PROPERTY: "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
    API_BASE_URL: "https://api.notion.com/v1",
    API_VERSION: "2026-03-11"
});

var TASK_ENGINE_NOTION_PROPERTIES = Object.freeze({
    TITLE: "Nombre",
    TYPE: "Tipo",
    STATUS: "Estado",
    TASK_ENGINE_ID: "Task Engine ID",
    AREA: "Área",
    CONTEXTS: "Contextos",
    TAGS: "Etiquetas",
    COMPLETED_AT: "Fecha de finalización",
    UPDATED_AT: "Última actualización desde Task Engine",
    LINKED: "Vinculada a Task Engine"
});

function setupNotion() {

    var status = getNotionStatus_(true);

    console.log(
        JSON.stringify({
            event: "notion_setup_verified",
            configured: status.configured,
            connected: status.connected,
            dataSourceId: status.dataSourceId,
            dataSourceName: status.dataSourceName
        })
    );

    return status;

}

function getNotionStatus_(validateRemote) {

    var configuration = getNotionConfiguration_();

    if (!configuration.configured) {
        return {
            ok: true,
            configured: false,
            connected: false,
            dataSourceId: "",
            dataSourceName: ""
        };
    }

    if (validateRemote !== true) {
        return {
            ok: true,
            configured: true,
            connected: null,
            dataSourceId: configuration.dataSourceId,
            dataSourceName: ""
        };
    }

    var dataSource = retrieveNotionDataSource_(configuration);

    return {
        ok: true,
        configured: true,
        connected: true,
        dataSourceId: dataSource.id,
        dataSourceName: notionRichTextToPlainText_(dataSource.title)
    };

}

function getNotionConfiguration_() {

    var properties = PropertiesService.getScriptProperties();
    var token = String(
        properties.getProperty(
            TASK_ENGINE_NOTION_SETTINGS.TOKEN_PROPERTY
        ) || ""
    ).trim();
    var dataSourceId = String(
        properties.getProperty(
            TASK_ENGINE_NOTION_SETTINGS.DATA_SOURCE_ID_PROPERTY
        ) || ""
    ).trim();

    return {
        configured: Boolean(token && dataSourceId),
        token: token,
        dataSourceId: dataSourceId
    };

}

function retrieveNotionDataSource_(configuration) {

    if (
        !configuration ||
        !configuration.token ||
        !configuration.dataSourceId
    ) {
        throw protocolError_(
            "NOTION_NOT_CONFIGURED",
            "Notion todavía no está configurado."
        );
    }

    var response = notionFetch_(
        TASK_ENGINE_NOTION_SETTINGS.API_BASE_URL +
        "/data_sources/" +
        encodeURIComponent(configuration.dataSourceId),
        {
            method: "get",
            headers: notionHeaders_(configuration.token),
            muteHttpExceptions: true
        },
        "No se pudo conectar con Notion."
    );
    var statusCode = Number(response.getResponseCode());
    var payload = parseNotionResponse_(response);

    if (statusCode >= 200 && statusCode < 300) {
        if (
            !payload ||
            payload.object !== "data_source" ||
            !payload.id
        ) {
            throw protocolError_(
                "NOTION_INVALID_RESPONSE",
                "Notion devolvió una respuesta inesperada."
            );
        }
        return payload;
    }

    throwNotionRequestError_(statusCode);

}

function createNotionTaskPage_(taskData) {

    var configuration = getNotionConfiguration_();

    if (!configuration.configured) {
        throw protocolError_(
            "NOTION_NOT_CONFIGURED",
            "Notion todavía no está configurado."
        );
    }

    var task = normalizeNotionTaskData_(taskData);
    var pageId = String(
        taskData && taskData.notionPageId || ""
    ).trim();
    var dataSource = retrieveNotionDataSource_(configuration);
    var schema = validateNotionDataSourceSchema_(dataSource);
    var properties = buildNotionTaskProperties_(
        task,
        schema.titleName
    );

    if (pageId) {
        return updateNotionTaskPage_(
            configuration,
            pageId,
            properties
        );
    }

    return createNotionPage_(configuration, properties);

}

function createNotionPage_(configuration, properties) {

    var response = notionFetch_(
        TASK_ENGINE_NOTION_SETTINGS.API_BASE_URL + "/pages",
        {
            method: "post",
            contentType: "application/json",
            headers: notionHeaders_(configuration.token),
            payload: JSON.stringify({
                parent: {
                    type: "data_source_id",
                    data_source_id: configuration.dataSourceId
                },
                properties: properties
            }),
            muteHttpExceptions: true
        },
        "No se pudo crear la nota en Notion."
    );
    var statusCode = Number(response.getResponseCode());
    var payload = parseNotionResponse_(response);

    if (statusCode >= 200 && statusCode < 300) {
        if (
            !payload ||
            payload.object !== "page" ||
            !payload.id ||
            !payload.url
        ) {
            throw protocolError_(
                "NOTION_INVALID_RESPONSE",
                "Notion creó la nota pero devolvió una respuesta inesperada."
            );
        }
        return {
            ok: true,
            pageId: payload.id,
            pageUrl: payload.url
        };
    }

    if (statusCode === 400) {
        throw protocolError_(
            "NOTION_SCHEMA_MISMATCH",
            "Notion rechazó las propiedades de la nota. Revisá la estructura de la base."
        );
    }

    throwNotionRequestError_(statusCode);

}

function updateNotionTaskPage_(configuration, pageId, properties) {

    if (!/^[A-Za-z0-9-]+$/.test(pageId)) {
        throw protocolError_(
            "INVALID_NOTION_PAGE",
            "El vínculo con la nota de Notion no es válido."
        );
    }

    var response = notionFetch_(
        TASK_ENGINE_NOTION_SETTINGS.API_BASE_URL +
        "/pages/" + encodeURIComponent(pageId),
        {
            method: "patch",
            contentType: "application/json",
            headers: notionHeaders_(configuration.token),
            payload: JSON.stringify({
                properties: properties
            }),
            muteHttpExceptions: true
        },
        "No se pudo actualizar la nota en Notion."
    );
    var statusCode = Number(response.getResponseCode());
    var payload = parseNotionResponse_(response);

    if (statusCode >= 200 && statusCode < 300) {
        if (
            !payload ||
            payload.object !== "page" ||
            !payload.id
        ) {
            throw protocolError_(
                "NOTION_INVALID_RESPONSE",
                "Notion actualizó la nota pero devolvió una respuesta inesperada."
            );
        }
        return {
            ok: true,
            pageId: payload.id,
            pageUrl: payload.url || ""
        };
    }

    if (statusCode === 400) {
        throw protocolError_(
            "NOTION_SCHEMA_MISMATCH",
            "Notion rechazó la actualización de propiedades. Revisá la estructura de la base."
        );
    }

    throwNotionRequestError_(statusCode);

}

function buildNotionTaskProperties_(task, titleName) {

    var properties = {};

    properties[titleName] = {
        title: [notionTextObject_(task.title)]
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.TYPE] = {
        select: {
            name: task.isProject ? "Proyecto" : "Tarea"
        }
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.STATUS] = {
        select: {
            name: notionTaskStatusName_(task.status)
        }
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.TASK_ENGINE_ID] = {
        rich_text: [notionTextObject_(task.id)]
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.AREA] = {
        select: task.areaName ? { name: task.areaName } : null
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.CONTEXTS] = {
        multi_select: task.contextNames.map(function(name) {
            return { name: name };
        })
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.TAGS] = {
        multi_select: task.tagNames.map(function(name) {
            return { name: name };
        })
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.COMPLETED_AT] = {
        date: task.completedAt
            ? { start: task.completedAt }
            : null
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.UPDATED_AT] = {
        date: {
            start: new Date().toISOString()
        }
    };
    properties[TASK_ENGINE_NOTION_PROPERTIES.LINKED] = {
        checkbox: task.linked !== false
    };

    return properties;

}

function normalizeNotionTaskData_(taskData) {

    var task = taskData || {};
    var id = String(task.id || "").trim();
    var title = String(task.title || "").trim();

    if (!id || !title) {
        throw protocolError_(
            "INVALID_NOTION_TASK",
            "La tarea no contiene los datos necesarios para sincronizar una nota."
        );
    }

    return {
        id: id,
        title: title.slice(0, 2000),
        status: String(task.status || "PENDING"),
        isProject: task.isProject === true,
        areaName: String(task.areaName || "")
            .trim()
            .slice(0, 100),
        contextNames: normalizeNotionNames_(task.contextNames),
        tagNames: normalizeNotionNames_(task.tagNames),
        completedAt: task.completedAt
            ? String(task.completedAt)
            : null,
        linked: task.linked !== false
    };

}

function normalizeNotionNames_(values) {

    if (!Array.isArray(values)) {
        return [];
    }

    var seen = {};

    return values
        .map(function(value) {
            return String(value || "")
                .trim()
                .slice(0, 100);
        })
        .filter(function(value) {
            if (!value || seen[value]) {
                return false;
            }
            seen[value] = true;
            return true;
        });

}

function notionTaskStatusName_(status) {

    var names = {
        COMPLETED: "Finalizada",
        ARCHIVED: "Archivada",
        DELETED: "Eliminada"
    };

    return names[status] || "Activa";

}

function notionTextObject_(content) {

    return {
        type: "text",
        text: {
            content: String(content || "")
        }
    };

}

function validateNotionDataSourceSchema_(dataSource) {

    var properties = dataSource && dataSource.properties || {};
    var titleNames = Object.keys(properties)
        .filter(function(name) {
            return properties[name] &&
                properties[name].type === "title";
        });
    var mismatches = [];

    if (titleNames.length !== 1) {
        mismatches.push(
            "Título: no se encontró una única propiedad de título"
        );
    }

    var expectedTypes = {};
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.TYPE] = "select";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.STATUS] = "select";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.TASK_ENGINE_ID] = "rich_text";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.AREA] = "select";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.CONTEXTS] = "multi_select";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.TAGS] = "multi_select";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.COMPLETED_AT] = "date";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.UPDATED_AT] = "date";
    expectedTypes[TASK_ENGINE_NOTION_PROPERTIES.LINKED] = "checkbox";

    Object.keys(expectedTypes).forEach(function(name) {

        var property = properties[name];
        var expectedType = expectedTypes[name];

        if (!property) {
            mismatches.push(name + ": falta la propiedad");
            return;
        }

        if (property.type !== expectedType) {
            mismatches.push(
                name +
                ": se esperaba " +
                notionPropertyTypeLabel_(expectedType) +
                " y se encontró " +
                notionPropertyTypeLabel_(property.type)
            );
        }

    });

    if (mismatches.length > 0) {
        throw protocolError_(
            "NOTION_SCHEMA_MISMATCH",
            "La estructura de la base de Notion no coincide: " +
                mismatches.join("; ") +
                "."
        );
    }

    return {
        titleName: titleNames[0]
    };

}

function notionPropertyTypeLabel_(type) {

    var labels = {
        title: "Título",
        select: "Selección",
        rich_text: "Texto",
        multi_select: "Selección múltiple",
        date: "Fecha",
        checkbox: "Casilla"
    };

    return labels[type] || String(type || "desconocido");

}

function notionHeaders_(token) {

    return {
        Authorization: "Bearer " + token,
        "Notion-Version": TASK_ENGINE_NOTION_SETTINGS.API_VERSION,
        Accept: "application/json"
    };

}

function notionFetch_(url, options, publicMessage) {

    try {
        return UrlFetchApp.fetch(url, options);
    } catch (error) {
        throw protocolError_(
            "NOTION_UNAVAILABLE",
            publicMessage
        );
    }

}

function throwNotionRequestError_(statusCode) {

    if (statusCode === 401) {
        throw protocolError_(
            "NOTION_UNAUTHORIZED",
            "El token de Notion no es válido."
        );
    }

    if (statusCode === 403) {
        throw protocolError_(
            "NOTION_FORBIDDEN",
            "La conexión de Notion no tiene acceso a la base configurada."
        );
    }

    if (statusCode === 404) {
        throw protocolError_(
            "NOTION_NOT_FOUND",
            "No se encontró la nota o la base de Notion configurada."
        );
    }

    if (statusCode === 429) {
        throw protocolError_(
            "NOTION_RATE_LIMITED",
            "Notion recibió demasiadas solicitudes. Intentá nuevamente en un momento."
        );
    }

    throw protocolError_(
        "NOTION_UNAVAILABLE",
        "Notion no pudo completar la solicitud."
    );

}

function parseNotionResponse_(response) {

    var contents = String(response.getContentText() || "");

    if (!contents) {
        return null;
    }

    try {
        return JSON.parse(contents);
    } catch (error) {
        throw protocolError_(
            "NOTION_INVALID_RESPONSE",
            "Notion devolvió una respuesta inválida."
        );
    }

}

function notionRichTextToPlainText_(richText) {

    if (!Array.isArray(richText)) {
        return "";
    }

    return richText
        .map(function(item) {
            return String(
                item && item.plain_text || ""
            );
        })
        .join("")
        .trim();

}
