var TASK_ENGINE_AI_SETTINGS = Object.freeze({
    API_KEY_PROPERTY: "TASK_ENGINE_GEMINI_API_KEY",
    MODEL_PROPERTY: "TASK_ENGINE_GEMINI_MODEL",
    DEFAULT_MODEL: "gemini-3.7-flash",
    API_BASE: "https://generativelanguage.googleapis.com/v1beta"
});

function getAiStatus_(validateRemote) {

    var properties =
        PropertiesService.getScriptProperties();
    var apiKey = String(
        properties.getProperty(
            TASK_ENGINE_AI_SETTINGS.API_KEY_PROPERTY
        ) || ""
    ).trim();
    var model = String(
        properties.getProperty(
            TASK_ENGINE_AI_SETTINGS.MODEL_PROPERTY
        ) ||
        TASK_ENGINE_AI_SETTINGS.DEFAULT_MODEL
    ).trim();

    if (!apiKey) {
        return {
            ok: true,
            configured: false,
            connected: false,
            provider: "Gemini",
            model: model
        };
    }

    if (validateRemote !== true) {
        return {
            ok: true,
            configured: true,
            connected: false,
            provider: "Gemini",
            model: model
        };
    }

    var response = UrlFetchApp.fetch(
        TASK_ENGINE_AI_SETTINGS.API_BASE +
            "/models/" +
            encodeURIComponent(model),
        {
            method: "get",
            headers: {
                "x-goog-api-key": apiKey
            },
            muteHttpExceptions: true
        }
    );
    var statusCode = response.getResponseCode();
    var payload = {};

    try {
        payload = JSON.parse(
            response.getContentText() || "{}"
        );
    } catch (error) {
        payload = {};
    }

    if (
        statusCode < 200 ||
        statusCode >= 300
    ) {
        var providerMessage =
            payload &&
            payload.error &&
            payload.error.message;

        throw protocolError_(
            "AI_CONNECTION_FAILED",
            providerMessage ||
                "No se pudo validar la conexión con Gemini."
        );
    }

    return {
        ok: true,
        configured: true,
        connected: true,
        provider: "Gemini",
        model:
            String(payload.name || "")
                .replace(/^models\//, "") ||
            model,
        modelDisplayName:
            payload.displayName || ""
    };

}
