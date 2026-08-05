import {
    AdvancedSearchSyntaxError,
    compileAdvancedSearch,
    matchesAdvancedSearch
} from "./AdvancedSearch.js";
import { normalizeSearchText } from "./TaskSearch.js";

const FIELD_PATTERN =
    /(^|[\s(])((?:hasattachments|tieneadjuntos|attachmentcontains|adjuntocontiene|attachment|adjunto))\s*:\s*("[^"]*"|'[^']*'|[^\s()]+)/gi;

const BOOLEAN_FIELDS = new Set([
    "hasattachments",
    "tieneadjuntos"
]);

function unquote(value) {

    const text = String(value ?? "");

    if (
        text.length >= 2 &&
        (
            (text.startsWith('"') && text.endsWith('"')) ||
            (text.startsWith("'") && text.endsWith("'"))
        )
    ) {
        return text.slice(1, -1);
    }

    return text;

}

function parseBoolean(value) {

    const normalized = normalizeSearchText(value);

    if (["true", "si", "yes", "1"].includes(normalized)) {
        return true;
    }

    if (["false", "no", "0"].includes(normalized)) {
        return false;
    }

    return null;

}

function replaceSentinels(expression, criteria) {

    if (!expression) return expression;

    if (["AND", "OR"].includes(expression.type)) {
        return {
            ...expression,
            left: replaceSentinels(expression.left, criteria),
            right: replaceSentinels(expression.right, criteria)
        };
    }

    if (expression.type === "NOT") {
        return {
            ...expression,
            expression: replaceSentinels(
                expression.expression,
                criteria
            )
        };
    }

    if (
        expression.type === "FIELD" &&
        expression.field === "title" &&
        criteria.has(expression.value)
    ) {
        return criteria.get(expression.value);
    }

    return expression;

}

export function compileAttachmentSearch(query = "") {

    const criteria = new Map();
    let index = 0;

    FIELD_PATTERN.lastIndex = 0;

    const transformedQuery = String(query).replace(
        FIELD_PATTERN,
        (match, prefix, field, rawValue) => {

            const normalizedField =
                normalizeSearchText(field);
            const value = unquote(rawValue);
            const sentinel =
                `__task_attachment_${index}__`;

            index += 1;

            if (
                BOOLEAN_FIELDS.has(normalizedField) &&
                parseBoolean(value) === null
            ) {
                throw new AdvancedSearchSyntaxError(
                    `El valor de "${field}" debe ser sí o no.`
                );
            }

            criteria.set(sentinel, {
                type: "ATTACHMENT",
                field: BOOLEAN_FIELDS.has(normalizedField)
                    ? "hasAttachments"
                    : "attachmentContains",
                value
            });

            return `${prefix}title:"${sentinel}"`;

        }
    );

    return {
        hasAttachmentCriteria: criteria.size > 0,
        expression: replaceSentinels(
            compileAdvancedSearch(transformedQuery),
            criteria
        )
    };

}

export function matchesAttachmentSearch(
    task,
    expression,
    context = {}
) {

    if (!expression) return true;

    switch (expression.type) {

        case "AND":
            return (
                matchesAttachmentSearch(
                    task,
                    expression.left,
                    context
                ) &&
                matchesAttachmentSearch(
                    task,
                    expression.right,
                    context
                )
            );

        case "OR":
            return (
                matchesAttachmentSearch(
                    task,
                    expression.left,
                    context
                ) ||
                matchesAttachmentSearch(
                    task,
                    expression.right,
                    context
                )
            );

        case "NOT":
            return !matchesAttachmentSearch(
                task,
                expression.expression,
                context
            );

        case "ATTACHMENT": {

            const attachments = Array.isArray(task.attachments)
                ? task.attachments
                : [];

            if (expression.field === "hasAttachments") {
                return (attachments.length > 0) ===
                    parseBoolean(expression.value);
            }

            const expected = normalizeSearchText(
                expression.value
            );

            return attachments.some(attachment =>
                normalizeSearchText(
                    `${attachment.name ?? ""} ${attachment.mimeType ?? ""}`
                ).includes(expected)
            );

        }

        default:
            return matchesAdvancedSearch(
                task,
                expression,
                context
            );

    }

}

export function filterTaskTreeByAttachmentSearch(
    tasks,
    expression,
    context = {}
) {

    if (!expression) return [...tasks];

    const tasksById = new Map(
        tasks.map(task => [task.id, task])
    );
    const includedIds = new Set();
    const searchContext = {
        ...context,
        tasks
    };

    for (const task of tasks) {

        if (!matchesAttachmentSearch(
            task,
            expression,
            searchContext
        )) {
            continue;
        }

        let currentTask = task;

        while (
            currentTask &&
            !includedIds.has(currentTask.id)
        ) {
            includedIds.add(currentTask.id);
            currentTask = tasksById.get(
                currentTask.parentTaskId
            );
        }

    }

    return tasks.filter(
        task => includedIds.has(task.id)
    );

}
