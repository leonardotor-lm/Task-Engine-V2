export const MAX_ATTACHMENTS_PER_TASK = 10;
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
export const MAX_ATTACHMENT_NAME_LENGTH = 180;

const SAFE_ID = /^[A-Za-z0-9_-]+$/;

export function normalizeAttachment(data = {}) {

    const id = String(data.id ?? "").trim();
    const driveFileId = String(
        data.driveFileId ?? ""
    ).trim();
    const name = String(data.name ?? "").trim();
    const mimeType = String(
        data.mimeType ?? ""
    ).trim();
    const size = Number(data.size);
    const url = String(data.url ?? "").trim();
    const createdAt = String(
        data.createdAt ?? ""
    ).trim();

    if (!SAFE_ID.test(id)) {
        throw new Error(
            "El identificador del adjunto es inválido."
        );
    }

    if (!SAFE_ID.test(driveFileId)) {
        throw new Error(
            "El archivo de Drive asociado es inválido."
        );
    }

    if (
        !name ||
        name.length > MAX_ATTACHMENT_NAME_LENGTH
    ) {
        throw new Error(
            `El nombre del adjunto debe tener entre 1 y ${MAX_ATTACHMENT_NAME_LENGTH} caracteres.`
        );
    }

    if (!mimeType || mimeType.length > 160) {
        throw new Error(
            "El tipo del adjunto es inválido."
        );
    }

    if (
        !Number.isInteger(size) ||
        size < 1 ||
        size > MAX_ATTACHMENT_BYTES
    ) {
        throw new Error(
            "El adjunto debe tener un tamaño válido y no superar 3 MB."
        );
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error(
            "El enlace del adjunto es inválido."
        );
    }

    if (
        parsedUrl.protocol !== "https:" ||
        parsedUrl.hostname !== "drive.google.com"
    ) {
        throw new Error(
            "El adjunto debe apuntar a Google Drive."
        );
    }

    if (
        !createdAt ||
        Number.isNaN(Date.parse(createdAt))
    ) {
        throw new Error(
            "La fecha del adjunto es inválida."
        );
    }

    return {
        id,
        driveFileId,
        name,
        mimeType,
        size,
        url,
        createdAt
    };

}

export function normalizeAttachments(
    attachments = []
) {

    if (!Array.isArray(attachments)) {
        throw new Error(
            "Los adjuntos de la tarea son inválidos."
        );
    }

    if (
        attachments.length >
        MAX_ATTACHMENTS_PER_TASK
    ) {
        throw new Error(
            `Una tarea admite hasta ${MAX_ATTACHMENTS_PER_TASK} adjuntos.`
        );
    }

    const normalized = attachments.map(
        normalizeAttachment
    );
    const ids = new Set();
    const driveFileIds = new Set();

    for (const attachment of normalized) {
        if (
            ids.has(attachment.id) ||
            driveFileIds.has(
                attachment.driveFileId
            )
        ) {
            throw new Error(
                "La tarea contiene adjuntos duplicados."
            );
        }

        ids.add(attachment.id);
        driveFileIds.add(
            attachment.driveFileId
        );
    }

    return normalized;

}
