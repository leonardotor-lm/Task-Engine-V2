const PRIORITIES = Object.freeze({
    baja: 1,
    media: 2,
    alta: 3,
    critica: 4
});

const NUMERIC_PRIORITIES = Object.freeze({
    1: 4,
    2: 3,
    3: 2,
    4: 1
});

const PRIORITY_LABELS = Object.freeze({
    1: "Prioridad baja",
    2: "Prioridad media",
    3: "Prioridad alta",
    4: "Prioridad crítica"
});

const WEEKDAYS = Object.freeze({
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6
});

function normalize(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}

function parseIsoDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
        String(value || "")
    );
    if (!match) return null;

    const date = new Date(
        Date.UTC(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        )
    );

    return (
        date.getUTCFullYear() === Number(match[1]) &&
        date.getUTCMonth() === Number(match[2]) - 1 &&
        date.getUTCDate() === Number(match[3])
    )
        ? date
        : null;
}

function toIsoDate(date) {
    return date.toISOString().slice(0, 10);
}

function addDays(today, amount) {
    const date = parseIsoDate(today);
    if (!date) return null;
    date.setUTCDate(date.getUTCDate() + amount);
    return toIsoDate(date);
}

function getNextWeekday(today, weekday) {
    const date = parseIsoDate(today);
    if (!date) return null;
    const difference = (
        weekday - date.getUTCDay() + 7
    ) % 7 || 7;
    date.setUTCDate(date.getUTCDate() + difference);
    return toIsoDate(date);
}

function getCalendarDate(day, month, year, today) {
    const reference = parseIsoDate(today);
    if (!reference) return null;

    let resolvedYear = year === undefined
        ? reference.getUTCFullYear()
        : Number(year);
    if (resolvedYear < 100) resolvedYear += 2000;

    let date = parseIsoDate(
        `${String(resolvedYear).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
    if (!date) return null;

    if (year === undefined && toIsoDate(date) < today) {
        resolvedYear += 1;
        date = parseIsoDate(
            `${resolvedYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        );
    }

    return date ? toIsoDate(date) : null;
}

function overlaps(candidate, matches) {
    return matches.some(match => (
        candidate.start < match.end &&
        candidate.end > match.start
    ));
}

function collectMatches(source, expression, resolve, matches) {
    for (const match of source.matchAll(expression)) {
        const candidate = {
            start: match.index,
            end: match.index + match[0].length,
            value: resolve(match),
            text: match[0]
        };
        if (!overlaps(candidate, matches)) {
            matches.push(candidate);
        }
    }
}

function findDateMatches(source, today) {
    const matches = [];

    collectMatches(
        source,
        /\b(?:para\s+)?(?:el\s+)?(pasado\s+mañana|mañana|hoy)\b/giu,
        match => {
            const relative = normalize(match[1]);
            return addDays(
                today,
                relative === "hoy"
                    ? 0
                    : relative === "manana"
                        ? 1
                        : 2
            );
        },
        matches
    );

    collectMatches(
        source,
        /\b(?:en|dentro\s+de)\s+(\d{1,3})\s+días?\b/giu,
        match => addDays(today, Number(match[1])),
        matches
    );

    collectMatches(
        source,
        /\b(?:para\s+)?(?:el\s+)?(?:(?:próximo|proximo)\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)(?:\s+(?:próximo|proximo))?\b/giu,
        match => getNextWeekday(
            today,
            WEEKDAYS[normalize(match[1])]
        ),
        matches
    );

    collectMatches(
        source,
        /\b(?:para\s+)?(?:el\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/gu,
        match => getCalendarDate(
            Number(match[1]),
            Number(match[2]),
            match[3],
            today
        ),
        matches
    );

    return matches;
}

function findTimeMatches(source) {
    const matches = [];

    collectMatches(
        source,
        /\ba\s+las?\s+([01]?\d|2[0-3])(?::([0-5]\d))?\b/giu,
        match => `${String(Number(match[1])).padStart(2, "0")}:${match[2] || "00"}`,
        matches
    );

    collectMatches(
        source,
        /\b([01]?\d|2[0-3]):([0-5]\d)\b/gu,
        match => `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`,
        matches
    );

    return matches;
}

function findPriorityMatches(source) {
    const matches = [];

    collectMatches(
        source,
        /\bprioridad\s+(baja|media|alta|crítica|critica)\b/giu,
        match => PRIORITIES[normalize(match[1])],
        matches
    );

    collectMatches(
        source,
        /(?:^|\s)!(baja|media|alta|crítica|critica)\b/giu,
        match => PRIORITIES[normalize(match[1])],
        matches
    );

    collectMatches(
        source,
        /(?:^|\s)!([1-4])\b/gu,
        match => NUMERIC_PRIORITIES[match[1]],
        matches
    );

    return matches;
}

function isMarkerBoundary(value) {
    return !value || /[\s,.;:!?/#@]/u.test(value);
}

function findMarkedEntities(source, marker, entities) {
    const normalizedEntities = entities
        .filter(entity => entity?.id && String(entity?.name || "").trim())
        .sort((left, right) => right.name.length - left.name.length);
    const matches = [];

    for (let index = 0; index < source.length; index += 1) {
        if (source[index] !== marker) continue;
        if (index > 0 && !isMarkerBoundary(source[index - 1])) continue;
        if (marker === "/" && /\d/u.test(source[index + 1] || "")) continue;

        const entity = normalizedEntities.find(candidate => {
            const name = String(candidate.name).trim();
            const fragment = source.slice(index + 1, index + 1 + name.length);
            const next = source[index + 1 + name.length];
            return (
                normalize(fragment) === normalize(name) &&
                isMarkerBoundary(next)
            );
        });

        if (!entity) continue;
        const end = index + 1 + String(entity.name).trim().length;
        matches.push({
            start: index,
            end,
            value: String(entity.id),
            label: String(entity.name).trim()
        });
        index = end - 1;
    }

    return matches;
}

function chooseSingle(matches, label, ranges, warnings) {
    const valid = matches.filter(match => match.value !== null);
    const values = [...new Set(valid.map(match => match.value))];

    if (values.length > 1) {
        warnings.push(`No se aplicó ${label} porque se indicaron varias opciones.`);
        return null;
    }
    if (!values.length) return null;

    valid.forEach(match => ranges.push(match));
    return values[0];
}

function cleanTitle(source, ranges) {
    if (!ranges.length) return source.trim();
    const characters = [...source];
    ranges.forEach(range => {
        for (let index = range.start; index < range.end; index += 1) {
            characters[index] = " ";
        }
    });

    return characters.join("")
        .replace(/\s+/gu, " ")
        .replace(/\s+([,.;:!?])/gu, "$1")
        .replace(/^[\s,.;:!-]+|[\s,.;:!-]+$/gu, "")
        .trim();
}

export function parseNaturalTaskEntry(
    source,
    {
        today,
        areas = [],
        contexts = [],
        tags = []
    } = {}
) {
    const text = String(source || "").trim();
    const ranges = [];
    const warnings = [];
    const recognized = [];

    if (!text || !parseIsoDate(today)) {
        return {
            title: text,
            dueDate: null,
            dueTime: null,
            priority: 0,
            areaId: null,
            contextId: null,
            tagIds: [],
            recognized,
            warnings
        };
    }

    const dueDate = chooseSingle(
        findDateMatches(text, today),
        "la fecha",
        ranges,
        warnings
    );
    const dueTime = chooseSingle(
        findTimeMatches(text),
        "la hora",
        ranges,
        warnings
    );
    const priority = chooseSingle(
        findPriorityMatches(text),
        "la prioridad",
        ranges,
        warnings
    ) || 0;

    const areaMatches = findMarkedEntities(text, "/", areas);
    const contextMatches = findMarkedEntities(text, "@", contexts);
    const tagMatches = findMarkedEntities(text, "#", tags);
    const areaId = chooseSingle(
        areaMatches,
        "el área",
        ranges,
        warnings
    );
    const contextId = chooseSingle(
        contextMatches,
        "el contexto",
        ranges,
        warnings
    );
    const tagIds = [...new Set(tagMatches.map(match => match.value))];
    tagMatches.forEach(match => ranges.push(match));

    if (dueDate) recognized.push({ type: "date", value: dueDate, label: dueDate });
    if (dueTime) recognized.push({ type: "time", value: dueTime, label: dueTime });
    if (priority) recognized.push({ type: "priority", value: priority, label: PRIORITY_LABELS[priority] });

    const area = areaMatches.find(match => match.value === areaId);
    const context = contextMatches.find(match => match.value === contextId);
    if (area) recognized.push({ type: "area", value: areaId, label: `Área: ${area.label}` });
    if (context) recognized.push({ type: "context", value: contextId, label: `Contexto: ${context.label}` });
    tagIds.forEach(id => {
        const tag = tagMatches.find(match => match.value === id);
        recognized.push({ type: "tag", value: id, label: `#${tag.label}` });
    });

    return {
        title: cleanTitle(text, ranges),
        dueDate,
        dueTime,
        priority,
        areaId,
        contextId,
        tagIds,
        recognized,
        warnings
    };
}
