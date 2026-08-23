function invalidStructuredResponse(kind) {
    return new Error(
        "La IA devolvió " + kind +
        " con formato inválido. Intentá nuevamente."
    );
}

export function requireAiStructuredCollection(
    parsed,
    collectionKey,
    { kind = "una propuesta" } = {}
) {
    if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !Array.isArray(parsed[collectionKey])
    ) {
        throw invalidStructuredResponse(kind);
    }

    return parsed[collectionKey];
}

export function assertAiStructuredResponseComplete(
    response,
    { kind = "La propuesta" } = {}
) {
    if (response?.truncated === true) {
        throw new Error(
            kind + " quedó incompleta. Intentá nuevamente."
        );
    }
}
