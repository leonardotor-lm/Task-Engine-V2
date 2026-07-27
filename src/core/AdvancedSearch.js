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
    eliminada: "isDeleted"
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

    if (/^<\d{4}-\d{2}-\d{2}$/.test(value)) {
        return Boolean(
            task.dueDate &&
            task.dueDate < value.slice(1)
        );
    }

    if (/^>\d{4}-\d{2}-\d{2}$/.test(value)) {
        return Boolean(
            task.dueDate &&
            task.dueDate > value.slice(1)
        );
    }

    return false;

}

function matchesField(task, node, context) {

    const normalizedValue =
        normalizeSearchText(node.value);

    switch (node.field) {

        case "status":
            return task.status ===
                STATUS_VALUES[normalizedValue];

        case "priority": {

            const numericValue =
                /^\d+$/.test(node.value)
                    ? Number(node.value)
                    : PRIORITY_VALUES[normalizedValue];

            return task.priority === numericValue;

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
