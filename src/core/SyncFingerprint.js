const COLLECTIONS = [
    "tasks",
    "areas",
    "contexts",
    "tags",
    "customFilters",
    "goals",
    "activityEvents"
];

function normalizePreferences(
    preferences,
    errorMessage
) {

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
        throw new Error(errorMessage);
    }

    return preferences;

}

function stableValue(value) {

    if (Array.isArray(value)) {
        return value.map(stableValue);
    }

    if (
        value === null ||
        typeof value !== "object"
    ) {
        return value;
    }

    return Object.fromEntries(
        Object.keys(value)
            .sort((first, second) =>
                first.localeCompare(second)
            )
            .map(key => [
                key,
                stableValue(value[key])
            ])
    );

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
                    "goals",
                    "activityEvents"
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

        const preferences =
            normalizePreferences(
                data.taskSortPreferences,
                "Las preferencias de orden están incompletas."
            );

        fingerprint.taskSortPreferences =
            Object.entries(preferences)
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

    if (
        Object.prototype.hasOwnProperty.call(
            data,
            "taskFilterPreferences"
        )
    ) {

        const preferences =
            normalizePreferences(
                data.taskFilterPreferences,
                "Las preferencias de filtros rápidos están incompletas."
            );
        const entries =
            Object.entries(preferences);

        if (entries.length > 0) {
            fingerprint.taskFilterPreferences =
                entries
                    .map(([viewKey, filters]) => ({
                        viewKey,
                        filters: stableValue(filters)
                    }))
                    .sort((a, b) =>
                        a.viewKey.localeCompare(
                            b.viewKey
                        )
                    );
        }

    }

    if (
        Object.prototype.hasOwnProperty.call(
            data,
            "projectPinPreferences"
        )
    ) {

        const preferences =
            normalizePreferences(
                data.projectPinPreferences,
                "Los proyectos anclados están incompletos."
            );
        const entries = Object.entries(preferences);

        if (entries.length > 0) {
            fingerprint.projectPinPreferences =
                stableValue(preferences);
        }

    }

    if (
        Object.prototype.hasOwnProperty.call(
            data,
            "displayPreferences"
        )
    ) {

        const preferences =
            normalizePreferences(
                data.displayPreferences,
                "Las preferencias de visualización están incompletas."
            );
        const entries = Object.entries(preferences);

        if (entries.length > 0) {
            fingerprint.displayPreferences =
                stableValue(preferences);
        }

    }

    return JSON.stringify(fingerprint);

}
