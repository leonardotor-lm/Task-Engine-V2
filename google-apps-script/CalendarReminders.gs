var TASK_ENGINE_CALENDAR_REMINDERS = Object.freeze({
    CALENDAR_ID_PROPERTY: "TASK_ENGINE_REMINDER_CALENDAR_ID",
    CALENDAR_NAME: "Task Engine — Recordatorios",
    EVENT_PROPERTY_PREFIX: "TASK_ENGINE_REMINDER_EVENT_",
    POPUP_MINUTES_FOR_ABSOLUTE: 5,
    SYNC_HANDLER: "syncCalendarReminders"
});

function setupCalendarReminders() {

    var calendar = getReminderCalendar_();

    ScriptApp.getProjectTriggers()
        .filter(function(trigger) {
            return trigger.getHandlerFunction() ===
                TASK_ENGINE_CALENDAR_REMINDERS.SYNC_HANDLER;
        })
        .forEach(function(trigger) {
            ScriptApp.deleteTrigger(trigger);
        });

    ScriptApp.newTrigger(
        TASK_ENGINE_CALENDAR_REMINDERS.SYNC_HANDLER
    )
        .timeBased()
        .everyMinutes(1)
        .create();

    var result = syncCalendarReminders();

    return {
        ok: true,
        calendarId: calendar.getId(),
        calendarName: calendar.getName(),
        synced: result.synced,
        removed: result.removed,
        errors: result.errors
    };
}

function syncCalendarReminders() {

    var snapshot = loadSnapshot_();
    var tasks = snapshot &&
        snapshot.data &&
        snapshot.data.data &&
        Array.isArray(snapshot.data.data.tasks)
            ? snapshot.data.data.tasks
            : [];

    var calendar = getReminderCalendar_();
    var properties = PropertiesService
        .getScriptProperties();
    var taskById = {};
    var synced = 0;
    var removed = 0;
    var errors = 0;

    tasks.forEach(function(task) {
        if (task && task.id) {
            taskById[String(task.id)] = task;
        }
    });

    tasks.forEach(function(task) {

        if (!task || !task.id) return;

        try {
            var desired = buildDesiredReminder_(task);
            var key = reminderEventPropertyKey_(task.id);
            var eventId = properties.getProperty(key);
            var event = getReminderEventById_(
                calendar,
                eventId
            );

            if (!desired) {
                if (event) {
                    event.deleteEvent();
                    removed += 1;
                }
                properties.deleteProperty(key);
                return;
            }

            if (!event) {
                event = calendar.createEvent(
                    desired.title,
                    desired.start,
                    desired.end,
                    {
                        description: desired.description
                    }
                );
                event.setTag(
                    "taskEngineTaskId",
                    String(task.id)
                );
                properties.setProperty(
                    key,
                    event.getId()
                );
            } else {
                event.setTitle(desired.title);
                event.setDescription(desired.description);
                event.setTime(
                    desired.start,
                    desired.end
                );
            }

            event.removeAllReminders();
            event.addPopupReminder(
                desired.popupMinutes
            );
            synced += 1;

        } catch (error) {
            errors += 1;
            console.warn(JSON.stringify({
                event: "calendar_reminder_sync_failed",
                taskId: String(task.id),
                message: String(
                    error && error.message || error
                )
            }));
        }

    });

    var allProperties = properties.getProperties();

    Object.keys(allProperties).forEach(function(key) {

        if (
            key.indexOf(
                TASK_ENGINE_CALENDAR_REMINDERS
                    .EVENT_PROPERTY_PREFIX
            ) !== 0
        ) {
            return;
        }

        var taskId = key.slice(
            TASK_ENGINE_CALENDAR_REMINDERS
                .EVENT_PROPERTY_PREFIX.length
        );

        if (taskById[taskId]) return;

        try {
            var orphan = getReminderEventById_(
                calendar,
                allProperties[key]
            );
            if (orphan) {
                orphan.deleteEvent();
                removed += 1;
            }
        } catch (error) {
            errors += 1;
        }

        properties.deleteProperty(key);
    });

    return {
        ok: true,
        synced: synced,
        removed: removed,
        errors: errors
    };
}

function getReminderCalendar_() {

    var properties = PropertiesService
        .getScriptProperties();
    var calendarId = properties.getProperty(
        TASK_ENGINE_CALENDAR_REMINDERS
            .CALENDAR_ID_PROPERTY
    );
    var calendar = null;

    if (calendarId) {
        try {
            calendar = CalendarApp.getCalendarById(
                calendarId
            );
        } catch (error) {
            calendar = null;
        }
    }

    if (!calendar) {
        var calendars = CalendarApp
            .getOwnedCalendarsByName(
                TASK_ENGINE_CALENDAR_REMINDERS
                    .CALENDAR_NAME
            );

        calendar = calendars.length > 0
            ? calendars[0]
            : CalendarApp.createCalendar(
                TASK_ENGINE_CALENDAR_REMINDERS
                    .CALENDAR_NAME,
                {
                    description:
                        "Recordatorios creados automáticamente por Task Engine."
                }
            );

        properties.setProperty(
            TASK_ENGINE_CALENDAR_REMINDERS
                .CALENDAR_ID_PROPERTY,
            calendar.getId()
        );
    }

    return calendar;
}

function buildDesiredReminder_(task) {

    if (!isReminderEligibleTask_(task)) {
        return null;
    }

    var reminder = task.reminder;

    if (!reminder || typeof reminder !== "object") {
        return null;
    }

    var now = new Date();
    var start;
    var popupMinutes;
    var triggerAt;

    if (reminder.type === "due") {

        if (!task.dueDate || !task.dueTime) {
            return null;
        }

        popupMinutes = Number(
            reminder.minutesBefore
        );

        if (
            !isAllowedDueReminderMinutes_(
                popupMinutes
            )
        ) {
            return null;
        }

        start = parseTaskDueDateTime_(
            task.dueDate,
            task.dueTime
        );

        triggerAt = new Date(
            start.getTime() -
            popupMinutes * 60 * 1000
        );

    } else if (reminder.type === "at") {

        triggerAt = new Date(reminder.at);

        if (Number.isNaN(triggerAt.getTime())) {
            return null;
        }

        popupMinutes =
            TASK_ENGINE_CALENDAR_REMINDERS
                .POPUP_MINUTES_FOR_ABSOLUTE;
        start = new Date(
            triggerAt.getTime() +
            popupMinutes * 60 * 1000
        );

    } else {
        return null;
    }

    if (triggerAt.getTime() <= now.getTime()) {
        return null;
    }

    var end = new Date(
        start.getTime() + 15 * 60 * 1000
    );

    return {
        title: "Recordatorio: " + String(task.title || "Tarea"),
        start: start,
        end: end,
        popupMinutes: popupMinutes,
        description:
            "Recordatorio administrado por Task Engine.\n" +
            "Tarea: " + String(task.title || "") + "\n" +
            "ID: " + String(task.id)
    };
}

function isReminderEligibleTask_(task) {

    return [
        "INBOX",
        "PENDING"
    ].indexOf(String(task.status || "")) !== -1;
}

function isAllowedDueReminderMinutes_(minutes) {

    return [
        5,
        15,
        30,
        60,
        1440,
        2880,
        7200,
        14400
    ].indexOf(minutes) !== -1;
}

function parseTaskDueDateTime_(dueDate, dueTime) {

    var dateParts = String(dueDate)
        .split("-")
        .map(Number);
    var timeParts = String(dueTime)
        .split(":")
        .map(Number);

    if (
        dateParts.length !== 3 ||
        timeParts.length !== 2 ||
        dateParts.some(Number.isNaN) ||
        timeParts.some(Number.isNaN)
    ) {
        throw new Error(
            "Fecha u hora de vencimiento inválida."
        );
    }

    return new Date(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2],
        timeParts[0],
        timeParts[1],
        0,
        0
    );
}

function reminderEventPropertyKey_(taskId) {

    return TASK_ENGINE_CALENDAR_REMINDERS
        .EVENT_PROPERTY_PREFIX +
        String(taskId);
}

function getReminderEventById_(calendar, eventId) {

    if (!eventId) return null;

    try {
        return calendar.getEventById(eventId);
    } catch (error) {
        return null;
    }
}
