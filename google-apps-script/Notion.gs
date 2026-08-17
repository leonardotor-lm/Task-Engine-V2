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
    UPDATED_AT: "Última actualización desde Task Engine"
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

    var configuration =
        getNotionConfiguration_();

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
            dataSourceId:
                configuration.dataSourceId,
            dataSourceName: ""
        };
    }

    var dataSource =
        retrieveNotionDataSource_(
            configuration
        );

    return {
        ok: true,
        configured: true,
        connected: true,
        dataSourceId: dataSource.id,
        dataSourceName:
            notionRichTextToPlainText_(
                dataSource.title
            )
    };

}

function getNotionConfiguration_() {

    var properties =
        PropertiesService.getScriptProperties();
    var token = String(
        properties.getProperty(
            TASK_ENGINE_NOTION_SETTINGS
                .TOKEN_PROPERTY
        ) || ""
    ).trim();
    var dataSourceId = String(
        properties.getProperty(
            TASK_ENGINE_NOTION_SETTINGS
                .DATA_SOURCE_ID_PROPERTY
        ) || ""
    ).trim();

    return {
        configured: Boolean(
            token && dataSourceId
        ),
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

    var response;

    try {
        response = UrlFetchApp.fetch(
            TASK_ENGINE_NOTION_SETTINGS
                .API_BASE_URL +
            "/data_sources/" +
            encodeURIComponent(
                configuration.dataSourceId
            ),
            {
                method: "get",
                headers: {
                    Authorization:
                        "Bearer " +
                        configuration.token,
                    "Notion-Version":
                        TASK_ENGINE_NOTION_SETTINGS
                            .API_VERSION,
                    Accept: "application/json"
                },
                muteHttpExceptions: true
            }
        );
    } catch (error) {
        throw protocolError_(
            "NOTION_UNAVAILABLE",
            "No se pudo conectar con Notion."
        );
    }

    var statusCode = Number(
        response.getResponseCode()
    );
    var payload =
        parseNotionResponse_(response);

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

    var configuration =
        getNotionConfiguration_();

    if (!configuration.configured) {
        throw protocolError_(
            "NOTION_NOT_CONFIGURED",
            "Notion todavía no está configurado."
        );
    }

    var task = normalizeNotionTaskData_(
        taskData
    );
    var dataSource =
        retrieveNotionDataSource_(
            configuration
        );

    validateNotionDataSourceSchema_(
        dataSource
    );

    var properties = {};

    properties[
        TASK_ENGINE_NOTION_PROPERTIES.TITLE
    ] = {
        title: [notionTextObject_(task.title)]
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES.TYPE
    ] = {
        select: {
            name: task.isProject
                ? "Proyecto"
                : "Tarea"
        }
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES.STATUS
    ] = {
        select: {
            name: notionTaskStatusName_(
                task.status
            )
        }
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES
            .TASK_ENGINE_ID
    ] = {
        rich_text: [
            notionTextObject_(task.id)
        ]
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES.AREA
    ] = {
        select: task.areaName
            ? { name: task.areaName }
            : null
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES.CONTEXTS
    ] = {
        multi_select:
            task.contextNames.map(
                function(name) {
                    return { name: name };
                }
            )
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES.TAGS
    ] = {
        multi_select:
            task.tagNames.map(
                function(name) {
                    return { name: name };
                }
            )
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES
            .COMPLETED_AT
    ] = {
        date: task.completedAt
            ? { start: task.completedAt }
            : null
    };
    properties[
        TASK_ENGINE_NOTION_PROPERTIES
            .UPDATED_AT
    ] = {
        date: {
            start: new Date().toISOString()
        }
    };

    var response;

    try {
        response = UrlFetchApp.fetch(
            TASK_ENGINE_NOTION_SETTINGS
                .API_BASE_URL +
            "/pages",
            {
                method: "post",
                contentType: "application/json",
                headers: {
                    Authorization:
                        "Bearer " +
                        configuration.token,
                    "Notion-Version":
                        TASK_ENGINE_NOTION_SETTINGS
                            .API_VERSION,
                    Accept: "application/json"
                },
                payload: JSON.stringify({
                    parent: {
                        type: "data_source_id",
                        data_source_id:
                            configuration.dataSourceId
                    },
                    properties: properties
                }),
                muteHttpExceptions: true
            }
        );
    } catch (error) {
        throw protocolError_(
            "NOTION_UNAVAILABLE",
            "No se pudo crear la nota en Notion."
        );
    }

    var statusCode = Number(
        response.getResponseCode()
    );
    var payload =
        parseNotionResponse_(response);

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
            "La estructura de la base de Notion no coincide con la configurada en Task Engine."
        );
    }

    throwNotionRequestError_(statusCode);

}

function normalizeNotionTaskData_(taskData) {

    var task = taskData || {};
    var id = String(task.id || "").trim();
    var title = String(task.title || "").trim();

    if (!id || !title) {
        throw protocolError_(
            "INVALID_NOTION_TASK",
            "La tarea no contiene los datos necesarios para crear una nota."
        );
    }

    return {
        id: id,
        title: title.slice(0, 2000),
        status: String(
            task.status || "PENDING"
        ),
        isProject: task.isProject === true,
        areaName:
            String(task.areaName || "")
                .trim()
                .slice(0, 100),
        contextNames:
            normalizeNotionNames_(
                task.contextNames
            ),
        tagNames:
            normalizeNotionNames_(
                task.tagNames
            ),
        completedAt:
            task.completedAt
                ? String(task.completedAt)
                : null
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

    var properties =
        dataSource && dataSource.properties || {};
    var expectedTypes = {};

    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES.TITLE
    ] = "title";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES.TYPE
    ] = "select";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES.STATUS
    ] = "select";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES
            .TASK_ENGINE_ID
    ] = "rich_text";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES.AREA
    ] = "select";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES.CONTEXTS
    ] = "multi_select";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES.TAGS
    ] = "multi_select";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES
            .COMPLETED_AT
    ] = "date";
    expectedTypes[
        TASK_ENGINE_NOTION_PROPERTIES
            .UPDATED_AT
    ] = "date";

    var mismatches = Object.keys(
        expectedTypes
    ).filter(function(name) {
        return !properties[name] ||
            properties[name].type !==
                expectedTypes[name];
    });

    if (mismatches.length > 0) {
        throw protocolError_(
            "NOTION_SCHEMA_MISMATCH",
            "La estructura de la base de Notion no coincide con la configurada en Task Engine. Revisá los nombres y tipos de sus propiedades."
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
            "No se encontró la base de Notion configurada."
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

    var contents = String(
        response.getContentText() || ""
    );

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
                item &&
                item.plain_text ||
                ""
            );
        })
        .join("")
        .trim();

}
