const COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags",
    "customFilters",
    "goals"
];

function normalizeTaskSortPreferences(preferences) {

    if (
        preferences === undefined ||
        preferences === null
    ) {
        return {};
    }

    if (
        typeof preferences !== "object" ||
        Array.isArray(preferences)
    ) {
        throw new Error(
            "Las preferencias de orden están incompletas."
        );
    }

    return preferences;

}

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

    if (
        Object.prototype.hasOwnProperty.call(
            data,
            "taskSortPreferences"
        )
    ) {

        const taskSortPreferences =
            normalizeTaskSortPreferences(
                data.taskSortPreferences
            );

        fingerprint.taskSortPreferences =
            Object.entries(taskSortPreferences)
                .map(([viewKey, sort]) => ({
                    viewKey,
                    sort
                }))
                .sort((a, b) =>
                    a.viewKey.localeCompare(
                        b.viewKey
                    )
                );

    }

    return JSON.stringify(fingerprint);

}
