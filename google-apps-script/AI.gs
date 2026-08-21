var TASK_ENGINE_AI_SETTINGS = Object.freeze({
    DEFAULT_PROVIDER: "groq",
    PROVIDERS: {
        groq: {
            LABEL: "Groq",
            API_KEY_PROPERTY: "TASK_ENGINE_GROQ_API_KEY",
            DEFAULT_MODEL: "openai/gpt-oss-20b",
            ALLOWED_MODELS: [
                "openai/gpt-oss-20b",
                "openai/gpt-oss-120b"
            ],
            API_BASE: "https://api.groq.com/openai/v1"
        },
        gemini: {
            LABEL: "Gemini",
            API_KEY_PROPERTY: "TASK_ENGINE_GEMINI_API_KEY",
            DEFAULT_MODEL: "gemini-3.5-flash-lite",
            ALLOWED_MODELS: [
                "gemini-3.5-flash-lite",
                "gemini-3.7-flash"
            ],
            API_BASE: "https://generativelanguage.googleapis.com/v1beta"
        }
    },
    MAX_QUESTION_LENGTH: 1000,
    MAX_CHAT_HISTORY_MESSAGES: 6,
    MAX_CHAT_MESSAGE_LENGTH: 1200
});

function normalizeAiProvider_(provider) {
    var normalized = String(provider || "").trim().toLowerCase();

    return TASK_ENGINE_AI_SETTINGS.PROVIDERS[normalized]
        ? normalized
        : TASK_ENGINE_AI_SETTINGS.DEFAULT_PROVIDER;
}

function getAiProviderSettings_(provider) {
    return TASK_ENGINE_AI_SETTINGS.PROVIDERS[
        normalizeAiProvider_(provider)
    ];
}

function getAiApiKey_(provider) {
    var settings = getAiProviderSettings_(provider);

    return String(
        PropertiesService.getScriptProperties()
            .getProperty(settings.API_KEY_PROPERTY) || ""
    ).trim();
}

function normalizeAiModel_(provider, model) {
    var settings = getAiProviderSettings_(provider);
    var normalized = String(model || "").trim();

    return settings.ALLOWED_MODELS.indexOf(normalized) !== -1
        ? normalized
        : settings.DEFAULT_MODEL;
}

function normalizeAiHistory_(history) {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .slice(-TASK_ENGINE_AI_SETTINGS.MAX_CHAT_HISTORY_MESSAGES)
        .map(function(message) {
            var role = message && message.role === "assistant"
                ? "assistant"
                : "user";
            var content = String(
                message && message.content || ""
            ).trim().slice(
                0,
                TASK_ENGINE_AI_SETTINGS.MAX_CHAT_MESSAGE_LENGTH
            );

            return content
                ? { role: role, content: content }
                : null;
        })
        .filter(Boolean);
}

function getAiStatus_(validateRemote) {
    var providers = {};
    var providerIds = Object.keys(
        TASK_ENGINE_AI_SETTINGS.PROVIDERS
    );

    providerIds.forEach(function(providerId) {
        providers[providerId] = getAiProviderStatus_(
            providerId,
            validateRemote === true
        );
    });

    var defaultStatus = providers[
        TASK_ENGINE_AI_SETTINGS.DEFAULT_PROVIDER
    ];

    return {
        ok: true,
        configured: defaultStatus.configured,
        connected: defaultStatus.connected,
        provider: defaultStatus.provider,
        model: defaultStatus.model,
        providers: providers
    };
}

function getAiProviderStatus_(provider, validateRemote) {
    var providerId = normalizeAiProvider_(provider);
    var settings = getAiProviderSettings_(providerId);
    var apiKey = getAiApiKey_(providerId);
    var model = settings.DEFAULT_MODEL;

    if (!apiKey) {
        return {
            configured: false,
            connected: false,
            provider: settings.LABEL,
            providerId: providerId,
            model: model
        };
    }

    if (validateRemote !== true) {
        return {
            configured: true,
            connected: false,
            provider: settings.LABEL,
            providerId: providerId,
            model: model
        };
    }

    if (providerId === "groq") {
        return verifyGroqProvider_(
            apiKey,
            model,
            settings
        );
    }

    var response = UrlFetchApp.fetch(
        settings.API_BASE +
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

    assertAiResponseOk_(
        response,
        payload,
        settings.LABEL
    );

    return {
        configured: true,
        connected: true,
        provider: settings.LABEL,
        providerId: providerId,
        model:
            String(payload.name || "")
                .replace(/^models\//, "") || model,
        modelDisplayName:
            payload.displayName || ""
    };
}

function verifyGroqProvider_(apiKey, model, settings) {
    var response = UrlFetchApp.fetch(
        settings.API_BASE + "/models",
        {
            method: "get",
            headers: {
                Authorization: "Bearer " + apiKey
            },
            muteHttpExceptions: true
        }
    );
    var payload = parseAiResponse_(response);

    assertAiResponseOk_(
        response,
        payload,
        settings.LABEL
    );

    var models = Array.isArray(payload.data)
        ? payload.data
        : [];
    var selectedModel = models.find(function(item) {
        return String(item && item.id || "") === model;
    });

    if (!selectedModel) {
        throw protocolError_(
            "AI_MODEL_UNAVAILABLE",
            "El modelo seleccionado de Groq no está disponible para esta cuenta."
        );
    }

    return {
        configured: true,
        connected: true,
        provider: settings.LABEL,
        providerId: "groq",
        model: model,
        modelDisplayName:
            selectedModel.owned_by || ""
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
        !Array.isArray(context.tasks)
    ) {
        throw protocolError_(
            "INVALID_AI_CONTEXT",
            "El contexto enviado a la IA es inválido."
        );
    }

    var providerId = normalizeAiProvider_(
        context.aiProvider
    );
    var settings = getAiProviderSettings_(providerId);
    var model = normalizeAiModel_(
        providerId,
        context.aiModel
    );
    var apiKey = getAiApiKey_(providerId);
    var history = normalizeAiHistory_(context.chatHistory);

    if (!apiKey) {
        throw protocolError_(
            "AI_NOT_CONFIGURED",
            "Falta configurar la clave de " +
                settings.LABEL +
                " en Apps Script."
        );
    }

    var taskContext = Object.assign({}, context);
    delete taskContext.chatHistory;
    delete taskContext.aiProvider;
    delete taskContext.aiModel;

    var prompt = [
        "Sos el asistente de Task Engine.",
        "Respondé en español claro y conciso.",
        "Task Engine seleccionó localmente las tareas relevantes según la consulta actual y el hilo reciente.",
        "Trabajá exclusivamente con ese contexto de tareas y con el historial de conversación recibido.",
        "No inventes tareas ni datos que no estén presentes.",
        "Esta operación es de sólo lectura: no afirmes que modificaste, completaste, eliminaste ni reordenaste tareas.",
        "Si el contexto no alcanza para responder, decilo explícitamente.",
        "Fecha de referencia: " + String(context.today || ""),
        "Consulta actual: " + normalizedQuestion,
        "Contexto JSON:",
        JSON.stringify(taskContext)
    ].join("\n\n");

    return providerId === "groq"
        ? queryGroq_(apiKey, model, prompt, history, context.tasks.length)
        : queryGemini_(apiKey, model, prompt, history, context.tasks.length);
}

function queryGroq_(apiKey, model, prompt, history, taskCount) {
    var messages = [
        {
            role: "system",
            content: "Sos un asistente de gestión de tareas. Mantené continuidad con el hilo reciente sin asumir datos que no estén presentes."
        }
    ];

    history.forEach(function(message) {
        messages.push({
            role: message.role,
            content: message.content
        });
    });

    messages.push({
        role: "user",
        content: prompt
    });

    var response = UrlFetchApp.fetch(
        TASK_ENGINE_AI_SETTINGS.PROVIDERS.groq.API_BASE +
            "/chat/completions",
        {
            method: "post",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + apiKey
            },
            payload: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.2,
                max_completion_tokens: 1200,
                reasoning_effort: "low"
            }),
            muteHttpExceptions: true
        }
    );
    var payload = parseAiResponse_(response);

    assertAiResponseOk_(response, payload, "Groq");

    var answer = String(
        payload &&
        payload.choices &&
        payload.choices[0] &&
        payload.choices[0].message &&
        payload.choices[0].message.content || ""
    ).trim();

    if (!answer) {
        throw protocolError_(
            "AI_EMPTY_RESPONSE",
            "Groq no devolvió una respuesta utilizable."
        );
    }

    return {
        ok: true,
        provider: "Groq",
        model: model,
        taskCount: taskCount,
        answer: answer
    };
}

function queryGemini_(apiKey, model, prompt, history, taskCount) {
    var contents = history.map(function(message) {
        return {
            role: message.role === "assistant"
                ? "model"
                : "user",
            parts: [{ text: message.content }]
        };
    });

    contents.push({
        role: "user",
        parts: [{ text: prompt }]
    });

    var response = UrlFetchApp.fetch(
        TASK_ENGINE_AI_SETTINGS.PROVIDERS.gemini.API_BASE +
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
                contents: contents,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1200
                }
            }),
            muteHttpExceptions: true
        }
    );
    var payload = parseAiResponse_(response);

    assertAiResponseOk_(response, payload, "Gemini");

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
        taskCount: taskCount,
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

function assertAiResponseOk_(response, payload, providerLabel) {
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
            "No se pudo completar la solicitud a " +
            providerLabel +
            "."
    );
}
