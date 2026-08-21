var TASK_ENGINE_AI_SETTINGS = Object.freeze({
    API_KEY_PROPERTY: "TASK_ENGINE_GEMINI_API_KEY",
    MODEL_PROPERTY: "TASK_ENGINE_GEMINI_MODEL",
    DEFAULT_MODEL: "gemini-3.5-flash-lite",
    ALLOWED_MODELS: [
        "gemini-3.5-flash-lite",
        "gemini-3.7-flash"
    ],
    API_BASE: "https://generativelanguage.googleapis.com/v1beta",
    MAX_QUESTION_LENGTH: 1000,
    MAX_TASKS: 300
});

function getAiApiKey_() {
    return String(
        PropertiesService.getScriptProperties()
            .getProperty(
                TASK_ENGINE_AI_SETTINGS.API_KEY_PROPERTY
            ) || ""
    ).trim();
}

function normalizeAiModel_(model) {
    var normalized = String(model || "").trim();

    if (
        TASK_ENGINE_AI_SETTINGS.ALLOWED_MODELS
            .indexOf(normalized) !== -1
    ) {
        return normalized;
    }

    return TASK_ENGINE_AI_SETTINGS.DEFAULT_MODEL;
}

function getAiModel_() {
    return normalizeAiModel_(
        PropertiesService.getScriptProperties()
            .getProperty(
                TASK_ENGINE_AI_SETTINGS.MODEL_PROPERTY
            ) ||
        TASK_ENGINE_AI_SETTINGS.DEFAULT_MODEL
    );
}

function getAiStatus_(validateRemote) {
    var apiKey = getAiApiKey_();
    var model = getAiModel_();

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
    var payload = parseAiResponse_(response);

    assertAiResponseOk_(response, payload);

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

function queryAi_(question, context) {
    var normalizedQuestion = String(
        question || ""
    ).trim();

    if (
        !normalizedQuestion ||
        normalizedQuestion.length >
            TASK_ENGINE_AI_SETTINGS.MAX_QUESTION_LENGTH
    ) {
        throw protocolError_(
            "INVALID_AI_QUERY",
            "La consulta a la IA es inválida."
        );
    }

    if (
        !context ||
        !Array.isArray(context.tasks) ||
        context.tasks.length >
            TASK_ENGINE_AI_SETTINGS.MAX_TASKS
    ) {
        throw protocolError_(
            "INVALID_AI_CONTEXT",
            "El contexto enviado a la IA es inválido."
        );
    }

    var apiKey = getAiApiKey_();
    var model = normalizeAiModel_(
        context.aiModel || getAiModel_()
    );

    if (!apiKey) {
        throw protocolError_(
            "AI_NOT_CONFIGURED",
            "La asistencia con IA no está configurada."
        );
    }

    var prompt = [
        "Sos el asistente de Task Engine.",
        "Respondé en español claro y conciso.",
        "Trabajá exclusivamente con el contexto de tareas que se incluye abajo.",
        "No inventes tareas ni datos que no estén presentes.",
        "Esta operación es de sólo lectura: no afirmes que modificaste, completaste, eliminaste ni reordenaste tareas.",
        "Si el contexto no alcanza para responder, decilo explícitamente.",
        "Fecha de referencia: " + String(context.today || ""),
        "Consulta del usuario: " + normalizedQuestion,
        "Contexto JSON:",
        JSON.stringify(context)
    ].join("\n\n");

    var response = UrlFetchApp.fetch(
        TASK_ENGINE_AI_SETTINGS.API_BASE +
            "/models/" +
            encodeURIComponent(model) +
            ":generateContent",
        {
            method: "post",
            contentType: "application/json",
            headers: {
                "x-goog-api-key": apiKey
            },
            payload: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1200
                }
            }),
            muteHttpExceptions: true
        }
    );
    var payload = parseAiResponse_(response);

    assertAiResponseOk_(response, payload);

    var candidates = payload.candidates || [];
    var parts =
        candidates[0] &&
        candidates[0].content &&
        candidates[0].content.parts || [];
    var answer = parts
        .map(function(part) {
            return String(part.text || "");
        })
        .join("\n")
        .trim();

    if (!answer) {
        throw protocolError_(
            "AI_EMPTY_RESPONSE",
            "Gemini no devolvió una respuesta utilizable."
        );
    }

    return {
        ok: true,
        provider: "Gemini",
        model: model,
        taskCount: context.tasks.length,
        answer: answer
    };
}

function parseAiResponse_(response) {
    var payload = {};

    try {
        payload = JSON.parse(
            response.getContentText() || "{}"
        );
    } catch (error) {
        payload = {};
    }

    return payload;
}

function assertAiResponseOk_(response, payload) {
    var statusCode = response.getResponseCode();

    if (
        statusCode >= 200 &&
        statusCode < 300
    ) {
        return;
    }

    var providerMessage =
        payload &&
        payload.error &&
        payload.error.message;

    throw protocolError_(
        "AI_CONNECTION_FAILED",
        providerMessage ||
            "No se pudo completar la solicitud a Gemini."
    );
}
