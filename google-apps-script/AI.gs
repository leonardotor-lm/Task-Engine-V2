var TASK_ENGINE_AI_SETTINGS = Object.freeze({
    DEFAULT_PROVIDER: "gemini",
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
            DEFAULT_MODEL: "gemini-3.7-flash",
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

function getAiStatus_(validateRemote, provider, model) {
    var providers = {};
    var requestedProvider = String(provider || "").trim();
    var providerIds = requestedProvider
        ? [normalizeAiProvider_(requestedProvider)]
        : Object.keys(TASK_ENGINE_AI_SETTINGS.PROVIDERS);

    providerIds.forEach(function(providerId) {
        try {
            providers[providerId] = getAiProviderStatus_(
                providerId,
                validateRemote === true,
                requestedProvider ? model : null
            );
        } catch (error) {
            var settings = getAiProviderSettings_(providerId);
            providers[providerId] = {
                configured: Boolean(getAiApiKey_(providerId)),
                connected: false,
                provider: settings.LABEL,
                providerId: providerId,
                model: normalizeAiModel_(providerId, requestedProvider ? model : null),
                error:
                    error.publicMessage ||
                    error.message ||
                    "No se pudo verificar el proveedor."
            };
        }
    });

    var selectedProvider = requestedProvider
        ? normalizeAiProvider_(requestedProvider)
        : TASK_ENGINE_AI_SETTINGS.DEFAULT_PROVIDER;
    var selectedStatus = providers[selectedProvider];

    return {
        ok: true,
        configured: selectedStatus.configured,
        connected: selectedStatus.connected,
        provider: selectedStatus.provider,
        providerId: selectedStatus.providerId,
        model: selectedStatus.model,
        error: selectedStatus.error || "",
        providers: providers
    };
}

function getAiProviderStatus_(provider, validateRemote, model) {
    var providerId = normalizeAiProvider_(provider);
    var settings = getAiProviderSettings_(providerId);
    var apiKey = getAiApiKey_(providerId);
    var resolvedModel = normalizeAiModel_(providerId, model);

    if (!apiKey) {
        return {
            configured: false,
            connected: false,
            provider: settings.LABEL,
            providerId: providerId,
            model: resolvedModel
        };
    }

    if (validateRemote !== true) {
        return {
            configured: true,
            connected: false,
            provider: settings.LABEL,
            providerId: providerId,
            model: resolvedModel
        };
    }

    if (providerId === "groq") {
        return verifyGroqProvider_(
            apiKey,
            resolvedModel,
            settings
        );
    }

    var response = UrlFetchApp.fetch(
        settings.API_BASE +
            "/models/" +
            encodeURIComponent(resolvedModel),
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
                .replace(/^models\//, "") || resolvedModel,
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

    if (context.requestType === "priorityProposal") {
        return queryPriorityProposal_(
            providerId,
            apiKey,
            model,
            context
        );
    }

    var taskContext = Object.assign({}, context);
    delete taskContext.chatHistory;
    delete taskContext.aiProvider;
    delete taskContext.aiModel;

    var prompt = [
        "Sos el asistente de Task Engine.",
        "Respondé en español claro, concreto y útil para tomar decisiones.",
        "Task Engine seleccionó localmente las tareas relevantes según la consulta actual y el hilo reciente.",
        "Trabajá exclusivamente con ese contexto de tareas y con el historial de conversación recibido.",
        "No te limites a enumerar o reformular propiedades. Interpretá semánticamente los títulos de las tareas y relacioná esa información con área, proyecto, contexto, etiquetas, prioridad, fechas, estado y espera cuando existan.",
        "Cuando la consulta pida priorizar, comparar, decidir o analizar, evaluá explícitamente factores como impacto probable, urgencia explícita o implícita, esfuerzo aparente, dependencias, capacidad de desbloquear otras tareas, compromisos y costo de postergación.",
        "Los campos daysUntilDue y daysSinceCreated son cálculos objetivos hechos por Task Engine. Usalos para el razonamiento temporal y no recalcules manualmente la distancia entre fechas cuando estén presentes.",
        "Podés hacer inferencias razonables a partir del lenguaje natural de los títulos y de las relaciones entre tareas, pero toda afirmación que no surja directamente de un campo explícito debe presentarse claramente como inferencia, posibilidad o hipótesis.",
        "No presentes como hechos consecuencias no registradas, como multas, obligatoriedad, pérdida de turnos, dependencias o bloqueos, salvo que el contexto las indique explícitamente. Si las deducís, marcá la inferencia.",
        "No asumas que la prioridad numérica o una fecha decide por sí sola qué conviene hacer: usalas como señales dentro de un análisis más amplio.",
        "Si hay varias opciones plausibles, comparalas y explicá brevemente por qué recomendarías una sobre otra.",
        "Si faltan datos decisivos, señalá qué incertidumbre cambia la recomendación en vez de responder con falsa seguridad.",
        "Usá un español natural y directo; evitá metáforas o expresiones rebuscadas que puedan volver ambigua la recomendación.",
        "Esta operación es de sólo lectura: no afirmes que modificaste, completaste, eliminaste ni reordenaste tareas.",
        "Fecha de referencia: " + String(context.today || ""),
        "Consulta actual: " + normalizedQuestion,
        "Contexto JSON:",
        JSON.stringify(taskContext)
    ].join("\n\n");

    return providerId === "groq"
        ? queryGroq_(apiKey, model, prompt, history, context.tasks.length)
        : queryGemini_(apiKey, model, prompt, history, context.tasks.length);
}

function queryPriorityProposal_(providerId, apiKey, model, context) {
    var proposalContext = {
        today: context.today || "",
        tasks: context.tasks
    };
    var prompt = [
        "Sos el asistente de Task Engine y vas a proponer prioridades para tareas pendientes.",
        "Esta operación es estrictamente de sólo lectura: no modifiques ninguna tarea.",
        "Analizá semánticamente título, proyecto, área, contexto, etiquetas, fechas, espera, antigüedad y prioridad actual.",
        "Usá daysUntilDue y daysSinceCreated cuando estén disponibles. No inventes hechos ni dependencias.",
        "Proponé sólo cambios de prioridad que estén suficientemente justificados; no hace falta cambiar todas las tareas.",
        "La prioridad debe ser un entero: 0 Sin prioridad, 1 Baja, 2 Media, 3 Alta, 4 Crítica.",
        "Devolvé exclusivamente JSON válido, sin Markdown ni texto adicional, con esta forma exacta:",
        '{"proposals":[{"taskId":"id exacto recibido","priority":3,"reason":"motivo breve en español"}]}',
        "Cada taskId debe copiar exactamente un taskId recibido. No inventes IDs.",
        "Si no sugerís cambios, devolvé {\"proposals\":[]}.",
        "Contexto JSON:",
        JSON.stringify(proposalContext)
    ].join("\n\n");

    var result = providerId === "groq"
        ? queryGroq_(apiKey, model, prompt, [], context.tasks.length)
        : queryGemini_(apiKey, model, prompt, [], context.tasks.length);

    if (result.truncated) {
        throw protocolError_(
            "AI_PROPOSAL_TRUNCATED",
            "La propuesta de prioridades quedó incompleta. Intentá nuevamente."
        );
    }

    return {
        ok: true,
        provider: result.provider,
        model: result.model,
        taskCount: context.tasks.length,
        proposals: parsePriorityProposals_(
            result.answer,
            context.tasks
        )
    };
}

function parsePriorityProposals_(answer, tasks) {
    var text = String(answer || "").trim();
    var firstBrace = text.indexOf("{");
    var lastBrace = text.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace < firstBrace) {
        throw protocolError_(
            "AI_INVALID_PROPOSAL",
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }

    var parsed;
    try {
        parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch (error) {
        throw protocolError_(
            "AI_INVALID_PROPOSAL",
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }

    var allowedTasks = {};
    (tasks || []).forEach(function(task) {
        var taskId = String(task && task.taskId || "");
        if (taskId) {
            allowedTasks[taskId] = Number(task.currentPriority || 0);
        }
    });

    var seen = {};
    if (!Array.isArray(parsed.proposals)) {
        throw protocolError_(
            "AI_INVALID_PROPOSAL",
            "La IA devolvió una propuesta con formato inválido. Intentá nuevamente."
        );
    }

    var proposals = parsed.proposals;

    return proposals
        .map(function(item) {
            var taskId = String(item && item.taskId || "").trim();
            var priority = Number(item && item.priority);
            var reason = String(item && item.reason || "").trim().slice(0, 320);

            if (
                !taskId ||
                !Object.prototype.hasOwnProperty.call(allowedTasks, taskId) ||
                seen[taskId] ||
                !Number.isInteger(priority) ||
                priority < 0 ||
                priority > 4 ||
                priority === allowedTasks[taskId]
            ) {
                return null;
            }

            seen[taskId] = true;
            return {
                taskId: taskId,
                currentPriority: allowedTasks[taskId],
                priority: priority,
                reason: reason || "Cambio sugerido por el análisis de la IA."
            };
        })
        .filter(Boolean);
}

function queryGroq_(apiKey, model, prompt, history, taskCount) {
    var messages = [
        {
            role: "system",
            content: "Sos un asistente de gestión de tareas orientado al análisis y a la toma de decisiones. Mantené continuidad con el hilo reciente y razoná sobre el significado de los títulos y metadatos sin inventar información."
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
                reasoning_effort: "medium"
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
                    maxOutputTokens: 2400
                }
            }),
            muteHttpExceptions: true
        }
    );
    var payload = parseAiResponse_(response);

    assertAiResponseOk_(response, payload, "Gemini");

    var candidates = payload.candidates || [];
    var candidate = candidates[0] || {};
    var parts =
        candidate.content &&
        candidate.content.parts || [];
    var answer = parts
        .map(function(part) {
            return String(part.text || "");
        })
        .join("\n")
        .trim();
    var truncated = candidate.finishReason === "MAX_TOKENS";

    if (!answer) {
        throw protocolError_(
            "AI_EMPTY_RESPONSE",
            "Gemini no devolvió una respuesta utilizable."
        );
    }

    if (truncated) {
        answer += "\n\nLa respuesta alcanzó el límite de longitud. Podés pedirme que continúe desde donde quedó.";
    }

    return {
        ok: true,
        provider: "Gemini",
        model: model,
        taskCount: taskCount,
        truncated: truncated,
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
