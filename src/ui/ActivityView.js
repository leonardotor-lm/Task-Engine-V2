import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";

const TYPE_PRESENTATION = Object.freeze({
    TASK_CREATED: ["Creaste", "plus"],
    TASK_UPDATED: ["Editaste", "edit"],
    TASK_COMPLETED: ["Completaste", "check"],
    TASK_REOPENED: ["Reabriste", "repeat"],
    TASK_POSTPONED: ["Pospusiste", "clock"],
    TASK_ARCHIVED: ["Archivaste", "more"],
    TASK_TRASHED: ["Enviaste a Papelera", "more"],
    TASK_RESTORED: ["Restauraste", "repeat"],
    TASK_DELETED: ["Eliminaste definitivamente", "close"],
    TASK_DUPLICATED: ["Duplicaste", "plus"],
    TASK_MOVED: ["Moviste", "corner-down-right"],
    RECURRENCE_ENDED: ["Finalizaste la recurrencia de", "repeat"],
    RECURRENCE_SKIPPED: ["Omitiste una ocurrencia de", "repeat"],
    ATTACHMENT_ADDED: ["Agregaste un adjunto a", "plus"],
    ATTACHMENT_REMOVED: ["Quitaste un adjunto de", "close"]
});

export class ActivityView {

    getDateKey(isoDate) {

        const date = new Date(isoDate);

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

    }

    getDateLabel(dateKey, today) {

        if (dateKey === today) return "Hoy";

        const todayDate = new Date(
            `${today}T12:00:00`
        );
        todayDate.setDate(
            todayDate.getDate() - 1
        );

        if (
            dateKey ===
            this.getDateKey(todayDate.toISOString())
        ) {
            return "Ayer";
        }

        return new Intl.DateTimeFormat(
            "es-AR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(
            new Date(`${dateKey}T12:00:00`)
        );

    }

    renderEvent(event, existingTaskIds) {

        const [label, icon] =
            TYPE_PRESENTATION[event.type] ??
            ["Modificaste", "edit"];
        const time = new Intl.DateTimeFormat(
            "es-AR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        ).format(new Date(event.createdAt));
        const canOpen =
            event.taskId &&
            existingTaskIds.has(event.taskId);
        const subject = canOpen
            ? `
                <button
                    type="button"
                    class="activitySubject openActivityTask"
                    data-task-id="${escapeHtml(event.taskId)}">
                    ${escapeHtml(event.taskTitle)}
                </button>
            `
            : `
                <strong class="activitySubjectText">
                    ${escapeHtml(event.taskTitle)}
                </strong>
            `;

        return `
            <li class="activityItem">
                <span class="activityIcon">
                    ${Icon.render(icon)}
                </span>

                <div class="activityItemBody">
                    <p class="activitySummary">
                        <span>${escapeHtml(label)}</span>
                        ${subject}
                    </p>
                    ${event.details
                        ? `
                            <p class="activityDetails">
                                ${escapeHtml(event.details)}
                            </p>
                        `
                        : ""}
                </div>

                <time
                    class="activityTime"
                    datetime="${escapeHtml(event.createdAt)}">
                    ${escapeHtml(time)}
                </time>
            </li>
        `;

    }

    render(state) {

        const events = state.activityEvents ?? [];
        const existingTaskIds = new Set(
            (state.allTasks ?? [])
                .map(task => task.id)
        );
        const groups = new Map();

        for (const event of events) {

            const key = this.getDateKey(
                event.createdAt
            );

            if (!groups.has(key)) {
                groups.set(key, []);
            }

            groups.get(key).push(event);

        }

        const content = groups.size > 0
            ? [...groups.entries()]
                .map(([date, items]) => `
                    <section class="activityDay">
                        <h2>
                            ${escapeHtml(
                                this.getDateLabel(
                                    date,
                                    state.today
                                )
                            )}
                        </h2>
                        <ol class="activityList">
                            ${items.map(event =>
                                this.renderEvent(
                                    event,
                                    existingTaskIds
                                )
                            ).join("")}
                        </ol>
                    </section>
                `).join("")
            : `
                <div class="activityEmptyState">
                    <h2>No hay actividad para mostrar</h2>
                    <p>
                        ${state.activityQuery ||
                        state.activityCategory !== "ALL"
                            ? "Probá con otra búsqueda o categoría."
                            : "Las próximas acciones relevantes aparecerán acá."}
                    </p>
                </div>
            `;

        return `
            <main class="content activityView">
                <header class="activityHeader">
                    <div>
                        <p class="activityEyebrow">Historial</p>
                        <h1>Actividad</h1>
                    </div>

                    <form
                        id="activitySearchForm"
                        class="activityControls"
                        role="search">
                        <label class="activitySearch">
                            ${Icon.render("search")}
                            <input
                                id="activitySearch"
                                type="search"
                                aria-label="Buscar en actividad"
                                value="${escapeHtml(state.activityQuery ?? "")}"
                                placeholder="Buscar tarea"
                                autocomplete="off">
                        </label>

                        <label class="activityCategory">
                            <select
                                id="activityCategory"
                                aria-label="Filtrar actividad">
                                ${[
                                    ["ALL", "Todas"],
                                    ["CREATION", "Creación"],
                                    ["CHANGES", "Cambios"],
                                    ["COMPLETION", "Finalización"],
                                    ["REMOVAL", "Archivo y eliminación"]
                                ].map(([value, label]) => `
                                    <option
                                        value="${value}"
                                        ${state.activityCategory === value
                                            ? "selected"
                                            : ""}>
                                        ${label}
                                    </option>
                                `).join("")}
                            </select>
                        </label>
                    </form>
                </header>

                <div class="activityTimeline">
                    ${content}
                </div>
            </main>
        `;

    }

}
