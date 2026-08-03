import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";

export class CalendarView {

    render(state) {

        const month = state.calendarMonth;
        const [year, monthNumber] = month
            .split("-")
            .map(Number);
        const firstDay = new Date(Date.UTC(
            year,
            monthNumber - 1,
            1
        ));
        const daysInMonth = new Date(Date.UTC(
            year,
            monthNumber,
            0
        )).getUTCDate();
        const leadingDays =
            (firstDay.getUTCDay() + 6) % 7;

        const pendingTasks = state.allTasks.filter(
            task =>
                task.dueDate &&
                !task.isCompleted() &&
                !task.isArchived() &&
                !task.isDeleted()
        );
        const tasksByDate = new Map();

        for (const task of pendingTasks) {
            const tasks =
                tasksByDate.get(task.dueDate) ?? [];
            tasks.push(task);
            tasksByDate.set(task.dueDate, tasks);
        }

        const cells = [];

        for (let index = 0; index < leadingDays; index++) {
            cells.push(`<span class="calendarEmptyDay"></span>`);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = tasksByDate.get(date)?.length ?? 0;

            cells.push(`
                <button
                    type="button"
                    class="calendarDay ${count ? "hasPendingTasks" : ""}"
                    data-date="${date}"
                    ${count ? "" : "disabled"}
                    aria-label="${day}${count
                        ? `: ${count} ${count === 1 ? "tarea pendiente" : "tareas pendientes"}`
                        : ": sin tareas pendientes"}">
                    <span>${day}</span>
                    ${count
                        ? `<span class="calendarTaskMarker" aria-hidden="true"></span>`
                        : ""}
                </button>
            `);
        }

        const selectedTasks = state.calendarSelectedDate
            ? tasksByDate.get(state.calendarSelectedDate) ?? []
            : [];
        const monthTitle = new Intl.DateTimeFormat(
            "es-AR",
            { month: "long", year: "numeric", timeZone: "UTC" }
        ).format(firstDay);

        return `
            <main class="content calendarView">
                <header class="calendarHeader">
                    <h2>Calendario</h2>
                    <div class="calendarMonthNavigation">
                        <button
                            id="previousCalendarMonth"
                            type="button"
                            class="iconButton"
                            aria-label="Mes anterior"
                            title="Mes anterior">
                            ${Icon.render("chevron-left")}
                        </button>
                        <strong>${escapeHtml(monthTitle)}</strong>
                        <button
                            id="nextCalendarMonth"
                            type="button"
                            class="iconButton"
                            aria-label="Mes siguiente"
                            title="Mes siguiente">
                            ${Icon.render("chevron-right")}
                        </button>
                    </div>
                </header>

                <div class="calendarWeekdays" aria-hidden="true">
                    ${["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
                        .map(day => `<span>${day}</span>`)
                        .join("")}
                </div>

                <div class="calendarGrid">
                    ${cells.join("")}
                </div>

                ${state.calendarSelectedDate
                    ? `
                        <dialog id="calendarDayDialog" class="calendarDayDialog">
                            <header>
                                <h3>Tareas del ${escapeHtml(state.calendarSelectedDate)}</h3>
                                <button
                                    id="closeCalendarDay"
                                    type="button"
                                    class="iconButton"
                                    aria-label="Cerrar"
                                    title="Cerrar">
                                    ${Icon.render("close")}
                                </button>
                            </header>
                            <ul>
                                ${selectedTasks.map(task => `
                                    <li>
                                        <strong>${escapeHtml(task.title)}</strong>
                                        ${task.dueTime
                                            ? `<time>${escapeHtml(task.dueTime)}</time>`
                                            : ""}
                                    </li>
                                `).join("")}
                            </ul>
                            <div class="dialogActions">
                                <button id="closeCalendarDayAction" type="button" class="secondaryAction">
                                    Cerrar
                                </button>
                            </div>
                        </dialog>
                    `
                    : ""}
            </main>
        `;

    }

}
