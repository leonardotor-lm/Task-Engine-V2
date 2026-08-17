var TASK_ENGINE_NOTION_SETTINGS = Object.freeze({
    TOKEN_PROPERTY: "TASK_ENGINE_NOTION_TOKEN",
    DATA_SOURCE_ID_PROPERTY: "TASK_ENGINE_NOTION_DATA_SOURCE_ID",
    API_BASE_URL: "https://api.notion.com/v1",
    API_VERSION: "2026-03-11"
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
