export const RecurrenceFrequency = Object.freeze({

    DAILY: "DAILY",

    WEEKLY: "WEEKLY",

    MONTHLY: "MONTHLY"

});

export const RecurrenceWeekday = Object.freeze({

    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6

});

export function isValidRecurrenceFrequency(value) {

    return Object
        .values(RecurrenceFrequency)
        .includes(value);

}

export function normalizeRecurrenceRule(
    frequency,
    {
        interval = 1,
        weekdays = []
    } = {}
) {

    if (!isValidRecurrenceFrequency(frequency)) {
        throw new Error(
            "Frecuencia de recurrencia inválida."
        );
    }

    const normalizedInterval =
        Number(interval);

    if (
        !Number.isInteger(
            normalizedInterval
        ) ||
        normalizedInterval < 1 ||
        normalizedInterval > 365
    ) {
        throw new Error(
            "El intervalo de recurrencia debe ser un número entero entre 1 y 365."
        );
    }

    const normalizedWeekdays = [
        ...new Set(
            (weekdays ?? []).map(Number)
        )
    ].sort((first, second) =>
        first - second
    );

    if (
        normalizedWeekdays.some(
            day =>
                !Number.isInteger(day) ||
                day < 0 ||
                day > 6
        )
    ) {
        throw new Error(
            "Uno de los días de recurrencia es inválido."
        );
    }

    if (
        frequency !==
            RecurrenceFrequency.WEEKLY &&
        normalizedWeekdays.length > 0
    ) {
        throw new Error(
            "Los días específicos sólo pueden usarse en una recurrencia semanal."
        );
    }

    return {
        interval:
            normalizedInterval,
        weekdays:
            normalizedWeekdays
    };

}

export function getNextRecurrenceDate(
    dueDate,
    frequency,
    rule = {}
) {

    if (!dueDate) {
        throw new Error(
            "La recurrencia necesita una fecha de vencimiento."
        );
    }

    const {
        interval,
        weekdays
    } = normalizeRecurrenceRule(
        frequency,
        rule
    );

    const date =
        parseDate(dueDate);

    if (
        frequency ===
        RecurrenceFrequency.DAILY
    ) {

        date.setUTCDate(
            date.getUTCDate() +
                interval
        );

        return formatDate(date);

    }

    if (
        frequency ===
        RecurrenceFrequency.WEEKLY
    ) {

        if (weekdays.length === 0) {

            date.setUTCDate(
                date.getUTCDate() +
                    7 * interval
            );

            return formatDate(date);

        }

        const currentDay =
            date.getUTCDay();

        const laterDay =
            weekdays.find(
                day => day > currentDay
            );

        const difference =
            laterDay !== undefined
                ? laterDay - currentDay
                : (
                    7 * interval -
                    currentDay +
                    weekdays[0]
                );

        date.setUTCDate(
            date.getUTCDate() +
                difference
        );

        return formatDate(date);

    }

    const currentYear =
        date.getUTCFullYear();

    const currentMonth =
        date.getUTCMonth();

    const currentDay =
        date.getUTCDate();

    const targetMonthIndex =
        currentMonth + interval;

    const targetYear =
        currentYear +
        Math.floor(
            targetMonthIndex / 12
        );

    const targetMonth =
        (
            targetMonthIndex % 12 +
            12
        ) % 12;

    const lastTargetDay =
        new Date(
            Date.UTC(
                targetYear,
                targetMonth + 1,
                0
            )
        ).getUTCDate();

    return formatDateParts(
        targetYear,
        targetMonth + 1,
        Math.min(
            currentDay,
            lastTargetDay
        )
    );

}

function parseDate(value) {

    const parts = value
        .split("-")
        .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(
            part =>
                !Number.isInteger(part)
        )
    ) {
        throw new Error(
            "Fecha de recurrencia inválida."
        );
    }

    const [
        year,
        month,
        day
    ] = parts;

    const date = new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !==
            month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new Error(
            "Fecha de recurrencia inválida."
        );
    }

    return date;

}

function formatDate(date) {

    return formatDateParts(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate()
    );

}

function formatDateParts(
    year,
    month,
    day
) {

    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");

}
