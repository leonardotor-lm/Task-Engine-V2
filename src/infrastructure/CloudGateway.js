export class SyncConflictError extends Error {

    constructor(
        message,
        remoteRevision = null
    ) {

        super(message);

        this.name = "SyncConflictError";
        this.remoteRevision = remoteRevision;

    }

}

export class SyncProtocolError extends Error {
    constructor(message, code = "SYNC_ERROR") {
        super(message);
        this.name = "SyncProtocolError";
        this.code = code;
    }
}

export class SyncTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = "SyncTimeoutError";
    }
}

export class SyncInvalidResponseError extends Error {
    constructor(response) {
        const status = Number(response?.status) || null;
        const contentType = response?.headers?.get?.("content-type")
            ?.split(";")[0] ?? null;
        const detail = [
            status ? `HTTP ${status}` : null,
            contentType
        ].filter(Boolean).join(", ");
        super("El servicio de sincronización devolvió una respuesta inválida" +
            (detail ? ` (${detail}).` : "."));
        this.name = "SyncInvalidResponseError";
        this.code = "INVALID_RESPONSE";
        this.httpStatus = status;
        this.contentType = contentType;
    }
}

export class CloudGateway {

    constructor({
        fetchFn = fetch,
        timeoutMs = 30000,
        writeTimeoutMs = 60000,
        lockManager = globalThis.navigator?.locks ?? null
    } = {}) {

        this.fetchFn = fetchFn;
        this.timeoutMs = timeoutMs;
        this.writeTimeoutMs = writeTimeoutMs;
        this.lockManager = lockManager;

    }

    requestWrite(url, options) {

        const operation = () => this.request(
            url,
            options,
            {
                timeoutMs: this.writeTimeoutMs,
                timeoutMessage:
                    "La subida tardó demasiado en responder. Estamos comprobando si llegó a guardarse."
            }
        );

        if (
            typeof this.lockManager?.request !==
                "function"
        ) {
            return operation();
        }

        return this.lockManager.request(
            `task-engine-sync-write:${url}`,
            { mode: "exclusive" },
            operation
        );

    }

    buildUrl(baseUrl) {

        const url = new URL(baseUrl);

        url.searchParams.delete("token");
        url.searchParams.delete("action");

        return url.toString();

    }

    async request(
        url,
        options = {},
        {
            timeoutMs = this.timeoutMs,
            timeoutMessage =
                "La sincronización tardó demasiado en responder."
        } = {}
    ) {

        const controller = new AbortController();

        const timeoutId = setTimeout(
            () => controller.abort(),
            timeoutMs
        );

        let onAbort;
        const expired = new Promise((_, reject) => {
            onAbort = () => reject(
                new SyncTimeoutError(timeoutMessage)
            );
            controller.signal.addEventListener(
                "abort", onAbort, { once: true }
            );
        });

        try {
            let response;
            try {
                response = await Promise.race([
                    this.fetchFn.call(
                        globalThis,
                        url,
                        {
                            ...options,
                            signal: controller.signal
                        }
                    ),
                    expired
                ]);
            } catch (error) {
                if (error.name === "AbortError" ||
                    error instanceof SyncTimeoutError) {
                    throw new SyncTimeoutError(timeoutMessage);
                }
                const detail = error?.message
                    ? `: ${error.message}`
                    : "";
                throw new Error(
                    `No se pudo conectar con el servicio de sincronización${detail}.`
                );
            }

            let payload;
            try {
                payload = await Promise.race([
                    response.json(), expired
                ]);
            } catch (error) {
                if (error instanceof SyncTimeoutError ||
                    error?.name === "AbortError") {
                    throw new SyncTimeoutError(timeoutMessage);
                }
                // Una escritura pudo completarse aunque la respuesta no sea JSON.
                throw new SyncInvalidResponseError(response);
            }

            if (!payload || typeof payload !== "object" ||
                Array.isArray(payload)) {
                throw new SyncInvalidResponseError(response);
            }

            if (!response.ok || payload.ok === false) {

                const code = payload.error?.code ?? payload.code;
                const message =
                    payload.error?.message ??
                    payload.message ??
                    "La sincronización fue rechazada.";
                const remoteRevision =
                    payload.error?.remoteRevision ??
                    payload.remoteRevision ??
                    null;

                if (code === "CONFLICT") {
                    throw new SyncConflictError(
                        message,
                        remoteRevision
                    );
                }

                throw new SyncProtocolError(message, code);

            }

            return payload;
        } finally {
            clearTimeout(timeoutId);
            controller.signal.removeEventListener("abort", onAbort);
        }

    }

    load({ url, token }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({ action: "load", token })
            }
        );
    }

    status({ url, token }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "status",
                    token
                })
            }
        );
    }

    save({ url, token, baseRevision, data }) {
        return this.requestWrite(
            this.buildUrl(url),
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "save",
                    token,
                    baseRevision,
                    data
                })
            }
        );
    }

    saveIncremental({
        url,
        token,
        baseRevision,
        changes
    }) {
        return this.requestWrite(
            this.buildUrl(url),
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "saveIncremental",
                    token,
                    baseRevision,
                    changes
                })
            }
        );
    }

    uploadAttachment({ url, token, name, mimeType, base64Data }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "uploadAttachment",
                    token,
                    attachment: { name, mimeType, base64Data }
                })
            }
        );
    }

    trashAttachment({ url, token, driveFileId }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "trashAttachment",
                    token,
                    driveFileId
                })
            }
        );
    }

    aiStatus({
        url,
        token,
        validateRemote = false,
        provider,
        model
    }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "aiStatus",
                    token,
                    validateRemote: validateRemote === true,
                    provider,
                    model
                })
            }
        );
    }

    aiQuery({
        url,
        token,
        question,
        context,
        provider,
        model
    }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "aiQuery",
                    token,
                    question,
                    context,
                    provider,
                    model
                })
            },
            {
                timeoutMs: 60000,
                timeoutMessage:
                    "La consulta a la IA tardó demasiado en responder."
            }
        );
    }

    notionStatus({ url, token, validateRemote = false }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "notionStatus",
                    token,
                    validateRemote: validateRemote === true
                })
            }
        );
    }

    createNotionTaskPage({ url, token, task }) {
        return this.request(
            this.buildUrl(url),
            {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "createNotionTaskPage",
                    token,
                    task
                })
            }
        );
    }

    updateNotionTaskPage({
        url,
        token,
        pageId,
        task
    }) {
        return this.createNotionTaskPage({
            url,
            token,
            task: {
                ...task,
                notionPageId: pageId
            }
        });
    }

    createNotionGoalPage({ url, token, goal }) {
        return this.createNotionTaskPage({
            url,
            token,
            task: {
                ...goal,
                entityType: "Objetivo"
            }
        });
    }

    updateNotionGoalPage({
        url,
        token,
        pageId,
        goal
    }) {
        return this.createNotionGoalPage({
            url,
            token,
            goal: {
                ...goal,
                notionPageId: pageId
            }
        });
    }

}
