import { Priority } from "../domain/Priority.js";
import { TaskStatus } from "../domain/TaskStatus.js";
import { normalizeSearchText } from "./TaskSearch.js";

export class AdvancedSearchSyntaxError extends Error {

    constructor(message) {
        super(message);
        this.name = "AdvancedSearchSyntaxError";
    }

}

const TOKEN = Object.freeze({
    WORD: "WORD",
    STRING: "STRING",
    COLON: "COLON",
    LPAREN: "LPAREN",
    RPAREN: "RPAREN",
    AND: "AND",
    OR: "OR",
    NOT: "NOT",
    EOF: "EOF"
});

const FIELD_ALIASES = Object.freeze({
    status: "status",
    estado: "status",
    priority: "priority",
    prioridad: "priority",
    area: "area",
    context: "context",
    contexto: "context",
    tag: "tag",
    etiqueta: "tag",
    due: "due",
    fecha: "due",
    hassubtasks: "hasSubtasks",
    tienesubtareas: "hasSubtasks",
    isrecurring: "isRecurring",
    recurrente: "isRecurring",
    isarchived: "isArchived",
    archivada: "isArchived",
    isdeleted: "isDeleted",
    eliminada: "isDeleted",
    title: "title",
    titulo: "title",
    description: "description",
    descripcion: "description",
    areacontains: "areaContains",
    areacontiene: "areaContains",
    contextcontains: "contextContains",
    contextocontiene: "contextContains",
    tagcontains: "tagContains",
    etiquetacontiene: "tagContains",
    istagged: "isTagged",
    tieneetiquetas: "isTagged",
    hasduedate: "hasDueDate",
    tienefecha: "hasDueDate",
    duebefore: "dueBefore",
    fechaantes: "dueBefore",
    dueafter: "dueAfter",
    fechadespues: "dueAfter",
    duewithin: "dueWithin",
    fechadentro: "dueWithin",
    completed: "completed",
    completada: "completed",
    completedbefore: "completedBefore",
    completadaantes: "completedBefore",
    completedafter: "completedAfter",
    completadadespues: "completedAfter",
    completedwithin: "completedWithin",
    completadadentro: "completedWithin",
    created: "created",
    creada: "created",
    createdbefore: "createdBefore",
    creadaantes: "createdBefore",
    createdafter: "createdAfter",
    creadadespues: "createdAfter",
    createdwithin: "createdWithin",
    creadadentro: "createdWithin",
    updated: "updated",
    actualizada: "updated",
    updatedbefore: "updatedBefore",
    actualizadaantes: "updatedBefore",
    updatedafter: "updatedAfter",
    actualizadadespues: "updatedAfter",
    updatedwithin: "updatedWithin",
    actualizadadentro: "updatedWithin",
    postponed: "postponed",
    posposiciones: "postponed",
    issubtask: "isSubtask",
    essubtarea: "isSubtask",
    hasattachments: "hasAttachments",
    tieneadjuntos: "hasAttachments",
    recurrence: "recurrence",
    repeticion: "recurrence",
    vence: "due",
    venceantes: "dueBefore",
    vencedespues: "dueAfter",
    vencedentro: "dueWithin",
    venceentre: "dueBetween",
    duebetween: "dueBetween",
    fechaentre: "dueBetween",
    createdbetween: "createdBetween",
    creadaentre: "createdBetween",
    updatedbetween: "updatedBetween",
    actualizadaentre: "updatedBetween",
    completedbetween: "completedBetween",
    completadaentre: "completedBetween",
    attachmentcontains: "attachmentContains",
    adjuntocontiene: "attachmentContains"
});

const STATUS_VALUES = Object.freeze({
    inbox: TaskStatus.INBOX,
    pendiente: TaskStatus.PENDING,
    pending: TaskStatus.PENDING,
    completada: TaskStatus.COMPLETED,
    completed: TaskStatus.COMPLETED,
    archivada: TaskStatus.ARCHIVED,
    archived: TaskStatus.ARCHIVED,
    eliminada: TaskStatus.DELETED,
    deleted: TaskStatus.DELETED,
    papelera: TaskStatus.DELETED
});

const PRIORITY_VALUES = Object.freeze({
    ninguna: Priority.NONE,
    none: Priority.NONE,
    baja: Priority.LOW,
    low: Priority.LOW,
    media: Priority.MEDIUM,
    medium: Priority.MEDIUM,
    alta: Priority.HIGH,
    high: Priority.HIGH,
    critica: Priority.CRITICAL,
    critical: Priority.CRITICAL
});

function tokenize(query) {

    const tokens = [];
    let index = 0;

    while (index < query.length) {

        const character = query[index];

        if (/\s/.test(character)) {
            index += 1;
            continue;
        }

        if (character === "(") {
            tokens.push({ type: TOKEN.LPAREN, value: character });
            index += 1;
            continue;
        }

        if (character === ")") {
            tokens.push({ type: TOKEN.RPAREN, value: character });
            index += 1;
            continue;
        }

        if (character === ":") {
            tokens.push({ type: TOKEN.COLON, value: character });
            index += 1;
            continue;
        }

        if (character === "\"" || character === "'") {

            const quote = character;
            let value = "";
            index += 1;

            while (
                index < query.length &&
                query[index] !== quote
            ) {
                value += query[index];
                index += 1;
            }

            if (index >= query.length) {
                throw new AdvancedSearchSyntaxError(
                    "Falta cerrar una frase entre comillas."
                );
            }

            index += 1;
            tokens.push({
                type: TOKEN.STRING,
                value
            });
            continue;

        }

        let value = "";

        while (
            index < query.length &&
            !/\s/.test(query[index]) &&
            !["(", ")", ":"].includes(query[index])
        ) {
            value += query[index];
            index += 1;
        }

        const operator = value.toUpperCase();

        tokens.push({
            type: [TOKEN.AND, TOKEN.OR, TOKEN.NOT]
                .includes(operator)
                ? operator
                : TOKEN.WORD,
            value
        });

    }

    tokens.push({ type: TOKEN.EOF, value: "" });

    return tokens;

}

function normalizeField(field) {

    const normalized = normalizeSearchText(field)
        .replace(/[^a-z]/g, "");

    const canonical = FIELD_ALIASES[normalized];

    if (!canonical) {
        throw new AdvancedSearchSyntaxError(
            `El campo "${field}" no existe.`
        );
    }

    return canonical;

}

class Parser {

    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    current() {
        return this.tokens[this.position];
    }

    consume(type) {

        const token = this.current();

        if (token.type !== type) {
            throw new AdvancedSearchSyntaxError(
                "La búsqueda está incompleta o tiene un operador mal ubicado."
            );
        }

        this.position += 1;
        return token;

    }

    startsExpression(type) {

        return [
            TOKEN.WORD,
            TOKEN.STRING,
            TOKEN.LPAREN,
            TOKEN.NOT
        ].includes(type);

    }

    parse() {

        const expression = this.parseOr();

        if (this.current().type !== TOKEN.EOF) {
            throw new AdvancedSearchSyntaxError(
                "Revisá los paréntesis y operadores de la búsqueda."
            );
        }

        return expression;

    }

    parseOr() {

        let left = this.parseAnd();

        while (this.current().type === TOKEN.OR) {

            this.consume(TOKEN.OR);

            left = {
                type: "OR",
                left,
                right: this.parseAnd()
            };

        }

        return left;

    }

    parseAnd() {

        let left = this.parseUnary();

        while (
            this.current().type === TOKEN.AND ||
            this.startsExpression(this.current().type)
        ) {

            if (this.current().type === TOKEN.AND) {
                this.consume(TOKEN.AND);
            }

            left = {
                type: "AND",
                left,
                right: this.parseUnary()
            };

        }

        return left;

    }

    parseUnary() {

        if (this.current().type === TOKEN.NOT) {

            this.consume(TOKEN.NOT);

            return {
                type: "NOT",
                expression: this.parseUnary()
            };

        }

        return this.parsePrimary();

    }

    parsePrimary() {

        if (this.current().type === TOKEN.LPAREN) {

            this.consume(TOKEN.LPAREN);
            const expression = this.parseOr();
            this.consume(TOKEN.RPAREN);

            return expression;

        }

        const token = this.current();

        if (
            token.type !== TOKEN.WORD &&
            token.type !== TOKEN.STRING
        ) {
            throw new AdvancedSearchSyntaxError(
                "Falta un término de búsqueda."
            );
        }

        this.position += 1;

        if (
            token.type === TOKEN.WORD &&
            this.current().type === TOKEN.COLON
        ) {

            this.consume(TOKEN.COLON);

            const value = this.current();

            if (
                value.type !== TOKEN.WORD &&
                value.type !== TOKEN.STRING
            ) {
                throw new AdvancedSearchSyntaxError(
                    `Falta el valor de "${token.value}".`
                );
            }

            this.position += 1;

            return {
                type: "FIELD",
                field: normalizeField(token.value),
                value: value.value
            };

        }

        return {
            type: "TEXT",
            value: token.value
        };

    }

}

export function compileAdvancedSearch(query = "") {

    if (!query.trim()) {
        return null;
    }

    return new Parser(
        tokenize(query)
    ).parse();

}

function matchesEntity(value, id, entities = []) {

    const normalizedValue =
        normalizeSearchText(value);

    return entities.some(entity => {

        return (
            entity.id === id &&
            (
                normalizeSearchText(entity.id) ===
                    normalizedValue ||
                normalizeSearchText(entity.name) ===
                    normalizedValue
            )
        );

    });

}

function containsEntityName(
    value,
    ids,
    entities = []
) {

    const normalizedValue =
        normalizeSearchText(value);

    return entities.some(entity => {

        return (
            ids.includes(entity.id) &&
            normalizeSearchText(entity.name)
                .includes(normalizedValue)
        );

    });

}

function dateOnly(value) {

    return typeof value === "string"
        ? value.slice(0, 10)
        : "";

}

function shiftDate(dateValue, days) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return "";
    }

    const date = new Date(
        `${dateValue}T00:00:00.000Z`
    );

    date.setUTCDate(
        date.getUTCDate() + days
    );

    return date.toISOString().slice(0, 10);

}

function resolveDate(value, today) {

    const normalized =
        normalizeSearchText(value);

    if (["hoy", "today"].includes(normalized)) {
        return today;
    }

    if (["ayer", "yesterday"].includes(normalized)) {
        return shiftDate(today, -1);
    }

    if ([
        "manana",
        "tomorrow"
    ].includes(normalized)) {
        return shiftDate(today, 1);
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? value
        : "";

}

function parseDurationDays(value) {

    const normalized =
        normalizeSearchText(value);

    const match = normalized.match(
        /^(\d+)\s*(dia|dias|day|days|semana|semanas|week|weeks)$/
    );

    if (!match) {
        return null;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    return unit.startsWith("semana") ||
        unit.startsWith("week")
        ? amount * 7
        : amount;

}

function matchesDateValue(
    dateValue,
    value,
    today
) {

    const normalized =
        normalizeSearchText(value);

    if ([
        "nunca",
        "never",
        "sin-fecha",
        "sinfecha"
    ].includes(normalized)) {
        return !dateValue;
    }

    const target = resolveDate(
        value,
        today
    );

    return Boolean(
        dateValue &&
        target &&
        dateOnly(dateValue) === target
    );

}

function matchesDateBoundary(
    dateValue,
    value,
    today,
    direction
) {

    const target = resolveDate(
        value,
        today
    );

    if (!dateValue || !target) {
        return false;
    }

    return direction === "before"
        ? dateOnly(dateValue) < target
        : dateOnly(dateValue) > target;

}

function matchesDateWithin(
    dateValue,
    value,
    today,
    future
) {

    const days = parseDurationDays(value);

    if (!dateValue || days === null) {
        return false;
    }

    const date = dateOnly(dateValue);
    const boundary = shiftDate(
        today,
        future ? days : -days
    );

    return future
        ? date >= today && date <= boundary
        : date >= boundary && date <= today;

}

function matchesDateBetween(
    dateValue,
    value,
    today
) {

    if (!dateValue) {
        return false;
    }

    const parts = String(value)
        .split(/\s*(?:,|\.\.)\s*/);

    if (parts.length !== 2) {
        return false;
    }

    const start = resolveDate(
        parts[0],
        today
    );

    const end = resolveDate(
        parts[1],
        today
    );

    if (!start || !end || start > end) {
        return false;
    }

    const date = dateOnly(dateValue);

    return date >= start && date <= end;

}

function matchesNumber(value, actual) {

    const normalized = value.replace(/\s/g, "");
    const match = normalized.match(
        /^(>=|<=|>|<|=)?(\d+)$/
    );

    if (!match) {
        return false;
    }

    const operator = match[1] ?? "=";
    const expected = Number(match[2]);

    switch (operator) {
        case ">": return actual > expected;
        case "<": return actual < expected;
        case ">=": return actual >= expected;
        case "<=": return actual <= expected;
        default: return actual === expected;
    }

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

function matchesDueDate(task, value, today) {

    const normalized = normalizeSearchText(value)
        .replace(/_/g, "-");

    if (["hoy", "today"].includes(normalized)) {
        return task.dueDate === today;
    }

    if ([
        "ayer",
        "yesterday",
        "manana",
        "tomorrow"
    ].includes(normalized)) {
        return matchesDateValue(
            task.dueDate,
            value,
            today
        );
    }

    if ([
        "atrasada",
        "vencida",
        "antes-de-hoy",
        "overdue"
    ].includes(normalized)) {
        return Boolean(
            task.dueDate &&
            task.dueDate < today
        );
    }

    if ([
        "proxima",
        "despues-de-hoy",
        "upcoming"
    ].includes(normalized)) {
        return Boolean(
            task.dueDate &&
            task.dueDate > today
        );
    }

    if ([
        "sin-fecha",
        "sinfecha",
        "none"
    ].includes(normalized)) {
        return !task.dueDate;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return task.dueDate === value;
    }

    const comparison = value.match(
        /^(>=|<=|>|<)(\d{4}-\d{2}-\d{2})$/
    );

    if (comparison && task.dueDate) {

        const [, operator, date] = comparison;

        switch (operator) {
            case ">": return task.dueDate > date;
            case "<": return task.dueDate < date;
            case ">=": return task.dueDate >= date;
            case "<=": return task.dueDate <= date;
            default: return false;
        }

    }

    return false;

}

function matchesField(task, node, context) {

    const normalizedValue =
        normalizeSearchText(node.value);

    switch (node.field) {

        case "status":

            if ([
                "incompleta",
                "incomplete",
                "activa",
                "active"
            ].includes(normalizedValue)) {
                return [
                    TaskStatus.INBOX,
                    TaskStatus.PENDING
                ].includes(task.status);
            }

            return task.status ===
                STATUS_VALUES[normalizedValue];

        case "priority": {

            const numericValue =
                /^\d+$/.test(node.value)
                    ? Number(node.value)
                    : PRIORITY_VALUES[normalizedValue];

            return task.priority === numericValue;

        }

        case "title":
            return normalizeSearchText(
                task.title ?? ""
            ).includes(normalizedValue);

        case "description":
            return normalizeSearchText(
                task.description ?? ""
            ).includes(normalizedValue);

        case "areaContains":
            return containsEntityName(
                node.value,
                task.areaId ? [task.areaId] : [],
                context.areas
            );

        case "contextContains":
            return containsEntityName(
                node.value,
                task.contextId
                    ? [task.contextId]
                    : [],
                context.contexts
            );

        case "tagContains":
            return containsEntityName(
                node.value,
                task.tagIds,
                context.tags
            );

        case "isTagged": {
            const expected = parseBoolean(node.value);
            return expected !== null &&
                (task.tagIds.length > 0) === expected;
        }

        case "hasDueDate": {
            const expected = parseBoolean(node.value);
            return expected !== null &&
                Boolean(task.dueDate) === expected;
        }

        case "area":
            return matchesEntity(
                node.value,
                task.areaId,
                context.areas
            );

        case "context":
            return matchesEntity(
                node.value,
                task.contextId,
                context.contexts
            );

        case "tag":
            return task.tagIds.some(
                tagId => matchesEntity(
                    node.value,
                    tagId,
                    context.tags
                )
            );

        case "due":
            return matchesDueDate(
                task,
                node.value,
                context.today
            );

        case "dueBefore":
            return matchesDateBoundary(
                task.dueDate,
                node.value,
                context.today,
                "before"
            );

        case "dueAfter":
            return matchesDateBoundary(
                task.dueDate,
                node.value,
                context.today,
                "after"
            );

        case "dueWithin":
            return matchesDateWithin(
                task.dueDate,
                node.value,
                context.today,
                true
            );

        case "dueBetween":
            return matchesDateBetween(
                task.dueDate,
                node.value,
                context.today
            );

        case "completed":
            return matchesDateValue(
                task.completedAt,
                node.value,
                context.today
            );

        case "completedBefore":
            return matchesDateBoundary(
                task.completedAt,
                node.value,
                context.today,
                "before"
            );

        case "completedAfter":
            return matchesDateBoundary(
                task.completedAt,
                node.value,
                context.today,
                "after"
            );

        case "completedWithin":
            return matchesDateWithin(
                task.completedAt,
                node.value,
                context.today,
                false
            );

        case "completedBetween":
            return matchesDateBetween(
                task.completedAt,
                node.value,
                context.today
            );

        case "created":
            return matchesDateValue(
                task.createdAt,
                node.value,
                context.today
            );

        case "createdBefore":
            return matchesDateBoundary(
                task.createdAt,
                node.value,
                context.today,
                "before"
            );

        case "createdAfter":
            return matchesDateBoundary(
                task.createdAt,
                node.value,
                context.today,
                "after"
            );

        case "createdWithin":
            return matchesDateWithin(
                task.createdAt,
                node.value,
                context.today,
                false
            );

        case "createdBetween":
            return matchesDateBetween(
                task.createdAt,
                node.value,
                context.today
            );

        case "updated":
            return matchesDateValue(
                task.updatedAt,
                node.value,
                context.today
            );

        case "updatedBefore":
            return matchesDateBoundary(
                task.updatedAt,
                node.value,
                context.today,
                "before"
            );

        case "updatedAfter":
            return matchesDateBoundary(
                task.updatedAt,
                node.value,
                context.today,
                "after"
            );

        case "updatedWithin":
            return matchesDateWithin(
                task.updatedAt,
                node.value,
                context.today,
                false
            );

        case "updatedBetween":
            return matchesDateBetween(
                task.updatedAt,
                node.value,
                context.today
            );

        case "postponed":
            return matchesNumber(
                node.value,
                task.postponements?.length ?? 0
            );

        case "isSubtask": {
            const expected = parseBoolean(node.value);
            return expected !== null &&
                Boolean(task.parentTaskId) === expected;
        }

        case "hasAttachments": {
            const expected = parseBoolean(node.value);
            return expected !== null &&
                (task.attachments?.length > 0) === expected;
        }

        case "attachmentContains":
            return (task.attachments ?? [])
                .some(attachment => {

                    const name =
                        typeof attachment === "string"
                            ? attachment
                            : (
                                attachment.name ??
                                attachment.fileName ??
                                attachment.filename ??
                                attachment.title ??
                                ""
                            );

                    return normalizeSearchText(name)
                        .includes(normalizedValue);

                });

        case "recurrence": {

            const values = {
                diaria: "DAILY",
                daily: "DAILY",
                semanal: "WEEKLY",
                weekly: "WEEKLY",
                mensual: "MONTHLY",
                monthly: "MONTHLY"
            };

            return task.recurrence ===
                values[normalizedValue];

        }

        case "hasSubtasks": {

            const expected =
                parseBoolean(node.value);

            if (expected === null) {
                return false;
            }

            const hasSubtasks =
                context.tasks.some(
                    item =>
                        item.parentTaskId ===
                        task.id
                );

            return hasSubtasks === expected;

        }

        case "isRecurring": {

            const expected =
                parseBoolean(node.value);

            return expected !== null &&
                Boolean(task.recurrence) === expected;

        }

        case "isArchived": {

            const expected =
                parseBoolean(node.value);

            return expected !== null &&
                (
                    task.status ===
                    TaskStatus.ARCHIVED
                ) === expected;

        }

        case "isDeleted": {

            const expected =
                parseBoolean(node.value);

            return expected !== null &&
                (
                    task.status ===
                    TaskStatus.DELETED
                ) === expected;

        }

        default:
            return false;

    }

}

export function matchesAdvancedSearch(
    task,
    expression,
    context = {}
) {

    if (!expression) {
        return true;
    }

    const searchContext = {
        areas: context.areas ?? [],
        contexts: context.contexts ?? [],
        tags: context.tags ?? [],
        tasks: context.tasks ?? [],
        today: context.today ?? ""
    };

    switch (expression.type) {

        case "AND":
            return (
                matchesAdvancedSearch(
                    task,
                    expression.left,
                    searchContext
                ) &&
                matchesAdvancedSearch(
                    task,
                    expression.right,
                    searchContext
                )
            );

        case "OR":
            return (
                matchesAdvancedSearch(
                    task,
                    expression.left,
                    searchContext
                ) ||
                matchesAdvancedSearch(
                    task,
                    expression.right,
                    searchContext
                )
            );

        case "NOT":
            return !matchesAdvancedSearch(
                task,
                expression.expression,
                searchContext
            );

        case "TEXT": {

            const searchableText =
                normalizeSearchText(
                    `${task.title ?? ""} ${task.description ?? ""}`
                );

            return searchableText.includes(
                normalizeSearchText(
                    expression.value
                )
            );

        }

        case "FIELD":
            return matchesField(
                task,
                expression,
                searchContext
            );

        default:
            return false;

    }

}


export function filterTaskTreeByAdvancedSearch(
    tasks,
    expression,
    context = {}
) {

    if (!expression) {
        return [...tasks];
    }

    const tasksById = new Map(
        tasks.map(task => [task.id, task])
    );

    const searchContext = {
        ...context,
        tasks
    };

    const includedIds = new Set();

    for (const task of tasks) {

        if (!matchesAdvancedSearch(
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
