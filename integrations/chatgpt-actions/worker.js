const ROUTES = Object.freeze({
    "/v1/context": "gptGetContext",
    "/v1/tasks/search": "gptSearchTasks",
    "/v1/tasks/get": "gptGetTask",
    "/v1/tasks/create": "gptCreateTask",
    "/v1/tasks/update": "gptUpdateTask",
    "/v1/tasks/complete": "gptCompleteTask"
});

export default {
    async fetch(request, environment) {
        return handleRequest(request, environment);
    }
};

export async function handleRequest(
    request,
    environment,
    fetchImplementation = fetch
) {

    if (request.method !== "POST") {
        return jsonResponse(
            405,
            errorBody(
                "METHOD_NOT_ALLOWED",
                "Usá solicitudes POST."
            )
        );
    }

    const url = new URL(request.url);
    const action = ROUTES[url.pathname];

    if (!action) {
        return jsonResponse(
            404,
            errorBody(
                "NOT_FOUND",
                "La operación solicitada no existe."
            )
        );
    }

    let accounts;

    try {
        accounts = parseAccounts(
            environment.TASK_ENGINE_ACCOUNTS
        );
    } catch {
        return jsonResponse(
            500,
            errorBody(
                "SERVER_NOT_CONFIGURED",
                "El intermediario no está configurado."
            )
        );
    }

    const apiKey = readBearerToken(request);
    const account = accounts.find(candidate =>
        safeEqual(candidate.apiKey, apiKey)
    );

    if (!account) {
        return jsonResponse(
            401,
            errorBody(
                "UNAUTHORIZED",
                "La credencial no es válida."
            )
        );
    }

    let input;

    try {
        input = await request.json();
    } catch {
        return jsonResponse(
            400,
            errorBody(
                "INVALID_JSON",
                "El cuerpo debe ser JSON válido."
            )
        );
    }

    if (
        !input ||
        typeof input !== "object" ||
        Array.isArray(input)
    ) {
        return jsonResponse(
            400,
            errorBody(
                "INVALID_INPUT",
                "Los datos enviados no son válidos."
            )
        );
    }

    let upstream;

    try {
        upstream = await fetchImplementation(
            account.endpoint,
            {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    action,
                    token: account.token,
                    input
                })
            }
        );
    } catch {
        return jsonResponse(
            502,
            errorBody(
                "UPSTREAM_UNAVAILABLE",
                "Task Engine no respondió."
            )
        );
    }

    let result;

    try {
        result = await upstream.json();
    } catch {
        return jsonResponse(
            502,
            errorBody(
                "INVALID_UPSTREAM_RESPONSE",
                "Task Engine devolvió una respuesta inválida."
            )
        );
    }

    return jsonResponse(
        result?.ok === false ? 409 : 200,
        result
    );

}

export function parseAccounts(raw) {

    const accounts = JSON.parse(raw || "[]");

    if (!Array.isArray(accounts) || accounts.length === 0) {
        throw new Error("Missing accounts");
    }

    return accounts.map(account => {
        if (
            !account ||
            typeof account.id !== "string" ||
            typeof account.apiKey !== "string" ||
            account.apiKey.length < 24 ||
            typeof account.token !== "string" ||
            !account.token ||
            !isHttpsUrl(account.endpoint)
        ) {
            throw new Error("Invalid account");
        }

        return account;
    });

}

function isHttpsUrl(value) {
    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

function readBearerToken(request) {
    const authorization =
        request.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : "";
}

function safeEqual(first, second) {

    if (
        typeof first !== "string" ||
        typeof second !== "string" ||
        first.length !== second.length
    ) return false;

    let difference = 0;

    for (let index = 0; index < first.length; index += 1) {
        difference |= first.charCodeAt(index) ^
            second.charCodeAt(index);
    }

    return difference === 0;

}

function errorBody(code, message) {
    return {
        ok: false,
        error: { code, message }
    };
}

function jsonResponse(status, body) {
    return new Response(
        JSON.stringify(body),
        {
            status,
            headers: {
                "content-type":
                    "application/json; charset=utf-8",
                "cache-control": "no-store",
                "x-content-type-options": "nosniff"
            }
        }
    );
}
