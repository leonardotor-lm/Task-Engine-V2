import { escapeHtml } from "./escapeHtml.js";

export const AdvancedSearchConnector =
    Object.freeze({
        AND: "AND",
        OR: "OR",
        AND_NOT: "AND NOT"
    });

const CRITERIA = Object.freeze({
    title: {
        label: "Título contiene",
        field: "titulo",
        type: "text",
        placeholder: "Palabra o frase"
    },
    description: {
        label: "Descripción contiene",
        field: "descripcion",
        type: "text",
        placeholder: "Palabra o frase"
    },
    priority: {
        label: "Prioridad",
        field: "prioridad",
        type: "choice",
        options: [
            ["ninguna", "Sin prioridad"],
            ["baja", "Baja"],
            ["media", "Media"],
            ["alta", "Alta"],
            ["critica", "Crítica"]
        ]
    },
    status: {
        label: "Estado",
        field: "estado",
        type: "choice",
        options: [
            ["incompleta", "Incompleta"],
            ["inbox", "Inbox"],
            ["pendiente", "Pendiente"],
            ["completada", "Completada"],
            ["archivada", "Archivada"],
            ["eliminada", "Papelera"]
        ]
    },
    area: {
        label: "Área",
        field: "area",
        type: "entity",
        source: "areas"
    },
    context: {
        label: "Contexto",
        field: "contexto",
        type: "entity",
        source: "contexts"
    },
    tag: {
        label: "Etiqueta",
        field: "etiqueta",
        type: "entity",
        source: "tags"
    },
    duePreset: {
        label: "Fecha",
        type: "clause",
        options: [
            ["fecha:hoy", "Hoy"],
            ["fecha:atrasada", "Atrasada"],
            ["fecha:manana", "Mañana"],
            ["fechaDespues:hoy", "Después de hoy"],
            [
                "fechaDentro:\"7 dias\"",
                "Dentro de 7 días"
            ],
            ["tieneFecha:no", "Sin fecha"]
        ]
    },
    completedPreset: {
        label: "Finalización",
        type: "clause",
        options: [
            ["completada:hoy", "Completada hoy"],
            [
                "completadaDentro:\"7 dias\"",
                "Completada en los últimos 7 días"
            ],
            [
                "completadaDentro:\"30 dias\"",
                "Completada en los últimos 30 días"
            ]
        ]
    },
    recurrence: {
        label: "Repetición",
        field: "repeticion",
        type: "choice",
        options: [
            ["diaria", "Diaria"],
            ["semanal", "Semanal"],
            ["mensual", "Mensual"]
        ]
    },
    hasDueDate: {
        label: "Tiene fecha",
        field: "tieneFecha",
        type: "boolean"
    },
    isTagged: {
        label: "Tiene etiquetas",
        field: "tieneEtiquetas",
        type: "boolean"
    },
    hasSubtasks: {
        label: "Tiene subtareas",
        field: "tieneSubtareas",
        type: "boolean"
    },
    isSubtask: {
        label: "Es subtarea",
        field: "esSubtarea",
        type: "boolean"
    },
    hasAttachments: {
        label: "Tiene adjuntos",
        field: "tieneAdjuntos",
        type: "boolean"
    },
    isRecurring: {
        label: "Es recurrente",
        field: "recurrente",
        type: "boolean"
    },
    postponed: {
        label: "Cantidad de posposiciones",
        field: "posposiciones",
        type: "number"
    }
});

function optionList(options) {

    return options.map(
        ([value, label]) => `
            <option value="${escapeHtml(value)}">
                ${escapeHtml(label)}
            </option>
        `
    ).join("");

}

function renderCriterionValue(
    key,
    criterion,
    sources
) {

    let control = "";

    switch (criterion.type) {

        case "text":
            control = `
                <input
                    data-wizard-value
                    type="text"
                    placeholder="${escapeHtml(
                        criterion.placeholder
                    )}">
            `;
            break;

        case "choice":
        case "clause":
            control = `
                <select data-wizard-value>
                    ${optionList(
                        criterion.options
                    )}
                </select>
            `;
            break;

        case "entity": {

            const entities =
                sources[criterion.source] ?? [];

            control = `
                <select
                    data-wizard-value
                    ${entities.length === 0
                        ? "disabled"
                        : ""}>
                    ${entities.length === 0
                        ? `
                            <option value="">
                                No hay opciones
                            </option>
                        `
                        : entities.map(entity => `
                            <option
                                value="${escapeHtml(
                                    entity.name
                                )}">
                                ${escapeHtml(
                                    entity.name
                                )}
                            </option>
                        `).join("")}
                </select>
            `;
            break;

        }

        case "boolean":
            control = `
                <select data-wizard-value>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                </select>
            `;
            break;

        case "number":
            control = `
                <div class="advancedSearchNumber">
                    <select data-wizard-comparison>
                        <option value="=">Igual a</option>
                        <option value=">">Mayor que</option>
                        <option value="<">Menor que</option>
                        <option value=">=">Mayor o igual</option>
                        <option value="<=">Menor o igual</option>
                    </select>
                    <input
                        data-wizard-value
                        type="number"
                        min="0"
                        step="1"
                        value="1">
                </div>
            `;
            break;

        default:
            break;

    }

    return `
        <div
            class="advancedSearchWizardValue"
            data-criterion-value="${escapeHtml(key)}"
            ${key === "title" ? "" : "hidden"}>
            ${control}
        </div>
    `;

}

export function renderAdvancedSearchWizard({
    areas = [],
    contexts = [],
    tags = []
} = {}) {

    const sources = {
        areas,
        contexts,
        tags
    };

    return `
        <details class="advancedSearchWizard">
            <summary>Construir búsqueda</summary>

            <form id="advancedSearchWizardForm">

                <label for="advancedSearchConnector">
                    Relación
                </label>
                <select id="advancedSearchConnector">
                    <option value="AND">Y</option>
                    <option value="OR">O</option>
                    <option value="AND NOT">Y NO</option>
                </select>

                <label for="advancedSearchCriterion">
                    Criterio
                </label>
                <select id="advancedSearchCriterion">
                    ${Object.entries(CRITERIA)
                        .map(([key, criterion]) => `
                            <option value="${escapeHtml(key)}">
                                ${escapeHtml(
                                    criterion.label
                                )}
                            </option>
                        `).join("")}
                </select>

                <div class="advancedSearchWizardValues">
                    ${Object.entries(CRITERIA)
                        .map(([key, criterion]) =>
                            renderCriterionValue(
                                key,
                                criterion,
                                sources
                            )
                        ).join("")}
                </div>

                <button type="submit">
                    Agregar criterio
                </button>

            </form>
        </details>
    `;

}

function quoteSearchValue(value) {

    const cleaned = String(value)
        .trim()
        .replace(/["']/g, " ");

    if (!cleaned) {
        return "";
    }

    return /\s/.test(cleaned)
        ? `"${cleaned}"`
        : cleaned;

}

export function createAdvancedSearchClause({
    criterion,
    value,
    comparison = "="
}) {

    const definition = CRITERIA[criterion];

    if (!definition) {
        return "";
    }

    if (definition.type === "clause") {
        return String(value).trim();
    }

    const quotedValue =
        quoteSearchValue(value);

    if (!quotedValue) {
        return "";
    }

    if (definition.type === "number") {

        const operator = [
            "=",
            ">",
            "<",
            ">=",
            "<="
        ].includes(comparison)
            ? comparison
            : "=";

        return `${definition.field}:${operator}${quotedValue}`;

    }

    return `${definition.field}:${quotedValue}`;

}

export function appendAdvancedSearchClause(
    query,
    clause,
    connector = AdvancedSearchConnector.AND
) {

    const current = String(query).trim();
    const nextClause = String(clause).trim();

    if (!nextClause) {
        return current;
    }

    if (!current) {
        return connector ===
            AdvancedSearchConnector.AND_NOT
            ? `NOT ${nextClause}`
            : nextClause;
    }

    const normalizedConnector = Object
        .values(AdvancedSearchConnector)
        .includes(connector)
        ? connector
        : AdvancedSearchConnector.AND;

    return `${current} ${normalizedConnector} ${nextClause}`;

}

export function getActiveWizardValueGroup(
    form,
    criterion
) {

    return form.querySelector(
        `[data-criterion-value="${criterion}"]`
    );

}
