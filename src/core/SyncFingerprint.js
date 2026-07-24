const COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags"
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

        if (!Array.isArray(data[collection])) {
            throw new Error(
                "La copia está incompleta."
            );
        }

        fingerprint[collection] =
            data[collection]
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
