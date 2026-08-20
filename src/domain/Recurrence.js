export const RecurrenceFrequency = Object.freeze({

    DAILY: "DAILY",

    WEEKLY: "WEEKLY",

    MONTHLY: "MONTHLY",

    MONTHLY_BUSINESS_FIRST:
        "MONTHLY_BUSINESS_FIRST",

    MONTHLY_BUSINESS_SECOND:
        "MONTHLY_BUSINESS_SECOND",

    MONTHLY_BUSINESS_THIRD:
        "MONTHLY_BUSINESS_THIRD",

    MONTHLY_BUSINESS_FOURTH:
        "MONTHLY_BUSINESS_FOURTH",

    MONTHLY_BUSINESS_FIFTH:
        "MONTHLY_BUSINESS_FIFTH",

    MONTHLY_BUSINESS_LAST:
        "MONTHLY_BUSINESS_LAST"

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

const BUSINESS_DAY_ORDINALS = Object.freeze({
    [RecurrenceFrequency.MONTHLY_BUSINESS_FIRST]: 1,
    [RecurrenceFrequency.MONTHLY_BUSINESS_SECOND]: 2,
    [RecurrenceFrequency.MONTHLY_BUSINESS_THIRD]: 3,
    [RecurrenceFrequency.MONTHLY_BUSINESS_FOURTH]: 4,
    [RecurrenceFrequency.MONTHLY_BUSINESS_FIFTH]: 5
});

export function isValidRecurrenceFrequency(value) {

    return Object
        .values(RecurrenceFrequency)
        .includes(value);

}

export function isBusinessMonthlyRecurrenceFrequency(
    value
) {

    return value ===
        RecurrenceFrequency.MONTHLY_BUSINESS_LAST ||
        Object.prototype.hasOwnProperty.call(
            BUSINESS_DAY_ORDINALS,
            value
        );

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

    const {
        year: targetYear,
        month: targetMonth
    } = getTargetMonth(
        date,
        interval
    );

    if (
        isBusinessMonthlyRecurrenceFrequency(
            frequency
        )
    ) {

        const day =
            frequency ===
                RecurrenceFrequency
                    .MONTHLY_BUSINESS_LAST
                ? getLastBusinessDay(
                    targetYear,
                    targetMonth
                )
                : getNthBusinessDay(
                    targetYear,
                    targetMonth,
                    BUSINESS_DAY_ORDINALS[
                        frequency
                    ]
                );

        return formatDateParts(
            targetYear,
            targetMonth,
            day
        );

    }

    const currentDay =
        date.getUTCDate();

    const lastTargetDay =
        new Date(
            Date.UTC(
                targetYear,
                targetMonth,
                0
            )
        ).getUTCDate();

    return formatDateParts(
        targetYear,
        targetMonth,
        Math.min(
            currentDay,
            lastTargetDay
        )
    );

}

function getTargetMonth(date, interval) {

    const currentYear =
        date.getUTCFullYear();

    const currentMonthIndex =
        date.getUTCMonth();

    const targetMonthIndex =
        currentMonthIndex + interval;

    const year =
        currentYear +
        Math.floor(
            targetMonthIndex / 12
        );

    const monthIndex =
        (
            targetMonthIndex % 12 +
            12
        ) % 12;

    return {
        year,
        month: monthIndex + 1
    };

}

function getNthBusinessDay(
    year,
    month,
    ordinal
) {

    let businessDayCount = 0;
    const lastDay = new Date(
        Date.UTC(year, month, 0)
    ).getUTCDate();

    for (
        let day = 1;
        day <= lastDay;
        day += 1
    ) {

        if (!isBusinessDay(year, month, day)) {
            continue;
        }

        businessDayCount += 1;

        if (businessDayCount === ordinal) {
            return day;
        }

    }

    throw new Error(
        "El día hábil solicitado no existe en el mes."
    );

}

function getLastBusinessDay(year, month) {

    const lastDay = new Date(
        Date.UTC(year, month, 0)
    ).getUTCDate();

    for (
        let day = lastDay;
        day >= 1;
        day -= 1
    ) {

        if (isBusinessDay(year, month, day)) {
            return day;
        }

    }

    throw new Error(
        "No se encontró un día hábil en el mes."
    );

}

function isBusinessDay(year, month, day) {

    const weekday = new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    ).getUTCDay();

    return weekday !== RecurrenceWeekday.SUNDAY &&
        weekday !== RecurrenceWeekday.SATURDAY;

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
