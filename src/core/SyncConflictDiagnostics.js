import {
    canonicalizeSyncBackup
} from "./SyncBackupCanonicalizer.js";

const COLLECTIONS = [
    ["tasks", "Tareas", "title"],
    ["areas", "Áreas", "name"],
    ["contexts", "Contextos", "name"],
    ["tags", "Etiquetas", "name"],
    ["customFilters", "Filtros", "name"],
    ["goals", "Objetivos", "title"],
    ["activityEvents", "Actividad", "taskTitle"]
];

function sortObjectKeys(value) {

    if (Array.isArray(value)) {
        return value.map(sortObjectKeys);
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
                sortObjectKeys(value[key])
            ])
    );

}

function valuesMatch(first, second) {

    return JSON.stringify(sortObjectKeys(first)) ===
        JSON.stringify(sortObjectKeys(second));

}

function toMap(items) {

    return new Map(
        (Array.isArray(items) ? items : [])
            .filter(item => item?.id)
            .map(item => [item.id, item])
    );

}

function describeItems(items, displayProperty) {

    const labels = items
        .slice(0, 5)
        .map(item =>
            String(
                item?.[displayProperty] ??
                item?.id ??
                "sin identificar"
            )
        );

    if (items.length > labels.length) {
        labels.push(
            `y ${items.length - labels.length} más`
        );
    }

    return labels.join(", ");

}

function compareCollection({
    localItems,
    remoteItems,
    label,
    displayProperty
}) {

    const local = toMap(localItems);
    const remote = toMap(remoteItems);
    const localOnly = [];
    const remoteOnly = [];
    const different = [];

    for (const [id, item] of local) {

        if (!remote.has(id)) {
            localOnly.push(item);
            continue;
        }

        if (!valuesMatch(item, remote.get(id))) {
            different.push(item);
        }

    }

    for (const [id, item] of remote) {

        if (!local.has(id)) {
            remoteOnly.push(item);
        }

    }

    const details = [];

    if (different.length) {
        details.push(
            `${label} con contenido distinto: ${describeItems(
                different,
                displayProperty
            )}.`
        );
    }

    if (localOnly.length) {
        details.push(
            `${label} sólo en este dispositivo: ${describeItems(
                localOnly,
                displayProperty
            )}.`
        );
    }

    if (remoteOnly.length) {
        details.push(
            `${label} sólo en la nube: ${describeItems(
                remoteOnly,
                displayProperty
            )}.`
        );
    }

    return details;

}

function normalizePreferences(value) {

    return value &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? value
        : {};

}

function comparePreferences(
    localValue,
    remoteValue,
    label
) {

    const local = normalizePreferences(localValue);
    const remote = normalizePreferences(remoteValue);
    const localOnly = [];
    const remoteOnly = [];
    const different = [];

    for (
        const [viewKey, value] of
        Object.entries(local)
    ) {

        if (!(viewKey in remote)) {
            localOnly.push(viewKey);
        } else if (
            !valuesMatch(remote[viewKey], value)
        ) {
            different.push(viewKey);
        }

    }

    for (const viewKey of Object.keys(remote)) {

        if (!(viewKey in local)) {
            remoteOnly.push(viewKey);
        }

    }

    const details = [];

    if (different.length) {
        details.push(
            `${label} distintos: ${different.slice(0, 5).join(", ")}.`
        );
    }

    if (localOnly.length) {
        details.push(
            `${label} sólo en este dispositivo: ${localOnly.slice(0, 5).join(", ")}.`
        );
    }

    if (remoteOnly.length) {
        details.push(
            `${label} sólo en la nube: ${remoteOnly.slice(0, 5).join(", ")}.`
        );
    }

    return details;

}

export function createSyncConflictDiagnostics({
    localBackup,
    remoteBackup
}) {

    if (!remoteBackup) {
        return [
            "La nube no contiene una copia de datos."
        ];
    }

    const local =
        canonicalizeSyncBackup(localBackup);
    const remote =
        canonicalizeSyncBackup(remoteBackup);

    if (!local?.data || !remote?.data) {
        return [
            "No se pudieron comparar las dos copias."
        ];
    }

    const details = [];

    if (
        local.format !== remote.format ||
        local.version !== remote.version
    ) {
        details.push(
            `Formato incompatible: local ${local.format ?? "desconocido"} v${local.version ?? "?"}; nube ${remote.format ?? "desconocido"} v${remote.version ?? "?"}.`
        );
    }

    for (
        const [collection, label, displayProperty]
        of COLLECTIONS
    ) {
        details.push(
            ...compareCollection({
                localItems: local.data[collection],
                remoteItems: remote.data[collection],
                label,
                displayProperty
            })
        );
    }

    details.push(
        ...comparePreferences(
            local.data.taskSortPreferences,
            remote.data.taskSortPreferences,
            "Órdenes"
        ),
        ...comparePreferences(
            local.data.taskFilterPreferences,
            remote.data.taskFilterPreferences,
            "Filtros rápidos"
        )
    );

    return details.length
        ? details
        : [
            "Las copias se normalizan como equivalentes; el conflicto proviene del estado de sincronización."
        ];

}
