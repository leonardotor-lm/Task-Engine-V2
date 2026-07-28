const COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags",
    "customFilters",
    "goals"
];

export function createSyncFingerprint(
    backup
) {

    const data = backup?.data;

    if (!data) {
        throw new Error(
            "No se puede identificar una copia vacía."
        );
    }

    const fingerprint = {};

    for (const collection of COLLECTIONS) {

        const entities =
            data[collection] ??
            (
                [
                    "customFilters",
                    "goals"
                ].includes(collection)
                    ? []
                    : null
            );

        if (!Array.isArray(entities)) {
            throw new Error(
                "La copia está incompleta."
            );
        }

        fingerprint[collection] =
            entities
                .map(entity => ({
                    id: entity.id,
                    version: entity.version
                }))
                .sort((a, b) =>
                    String(a.id).localeCompare(
                        String(b.id)
                    )
                );

    }

    return JSON.stringify(fingerprint);

}
