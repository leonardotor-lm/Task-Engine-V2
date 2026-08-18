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

export class CloudGateway {

    constructor({
        fetchFn = fetch,
        timeoutMs = 15000
    } = {}) {

        this.fetchFn = fetchFn;
        this.timeoutMs = timeoutMs;

    }

    buildUrl(baseUrl) {

        const url = new URL(baseUrl);

        url.searchParams.delete("token");
        url.searchParams.delete("action");

        return url.toString();

    }

    async request(
        url,
        options = {}
    ) {

        const controller = new AbortController();

        const timeoutId = setTimeout(
            () => controller.abort(),
            this.timeoutMs
        );

        let response;

        try {

            response = await this.fetchFn.call(
                globalThis,
                url,
                {
                    ...options,
                    signal: controller.signal
                }
            );

        } catch (error) {

            if (error.name === "AbortError") {
                throw new Error(
                    "La sincronización tardó demasiado en responder."
                );
            }

            const detail = error?.message
                ? `: ${error.message}`
                : "";

            throw new Error(
                `No se pudo conectar con el servicio de sincronización${detail}.`
            );

        } finally {

            clearTimeout(timeoutId);

        }

        let payload;

        try {
            payload = await response.json();
        } catch {
            throw new Error(
                "El servicio de sincronización devolvió una respuesta inválida."
            );
        }

        if (!response.ok || payload?.ok === false) {

            const code = payload?.error?.code ?? payload?.code;
            const message =
                payload?.error?.message ??
                payload?.message ??
                "La sincronización fue rechazada.";
            const remoteRevision =
                payload?.error?.remoteRevision ??
                payload?.remoteRevision ??
                null;

            if (code === "CONFLICT") {
                throw new SyncConflictError(
                    message,
                    remoteRevision
                );
            }

            throw new Error(message);

        }

        return payload;

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

    save({ url, token, baseRevision, data }) {
        return this.request(
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
