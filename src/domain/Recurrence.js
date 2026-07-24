export const RecurrenceFrequency = Object.freeze({

    DAILY: "DAILY",

    WEEKLY: "WEEKLY",

    MONTHLY: "MONTHLY"

});

export function isValidRecurrenceFrequency(value) {

    return Object
        .values(RecurrenceFrequency)
        .includes(value);

}

export function getNextRecurrenceDate(dueDate, frequency) {

    if (!dueDate) {
        throw new Error(
            "La recurrencia necesita una fecha de vencimiento."
        );
    }

    if (!isValidRecurrenceFrequency(frequency)) {
        throw new Error("Frecuencia de recurrencia inválida.");
    }

    const [year, month, day] = dueDate
        .split("-")
        .map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    if (frequency === RecurrenceFrequency.DAILY) {

        date.setUTCDate(date.getUTCDate() + 1);

    } else if (frequency === RecurrenceFrequency.WEEKLY) {

        date.setUTCDate(date.getUTCDate() + 7);

    } else {

        const lastDayOfNextMonth = new Date(
            Date.UTC(year, month + 1, 0)
        ).getUTCDate();

        return formatDateParts(
            month === 12 ? year + 1 : year,
            month === 12 ? 1 : month + 1,
            Math.min(day, lastDayOfNextMonth)
        );

    }

    return formatDateParts(
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate()
    );

}

function formatDateParts(year, month, day) {

    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");

}
