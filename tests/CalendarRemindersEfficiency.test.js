import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
    new URL("../google-apps-script/CalendarReminders.gs", import.meta.url),
    "utf8"
);

function harness(tasks) {
    const values = new Map();
    const cacheValues = new Map();
    const counts = {
        status: 0,
        snapshot: 0,
        deletedProperties: 0,
        createdEvents: 0,
        fetchedEvents: 0
    };
    let revision = 1;
    const event = {
        getId: () => "calendar-event-1",
        setTag() {},
        removeAllReminders() {},
        addPopupReminder() {},
        setTitle() {},
        setDescription() {},
        setTime() {}
    };
    const calendar = {
        createEvent() {
            counts.createdEvents += 1;
            return event;
        },
        getEventById() {
            counts.fetchedEvents += 1;
            return event;
        }
    };
    const context = {
        console: { warn() {} },
        LockService: {
            getScriptLock: () => ({
                tryLock: () => true,
                releaseLock() {}
            })
        },
        CacheService: {
            getScriptCache: () => ({
                get: key => cacheValues.get(key) ?? null,
                put: (key, value) => cacheValues.set(key, value),
                remove: key => cacheValues.delete(key)
            })
        },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: key => values.get(key) ?? null,
                getProperties: () => Object.fromEntries(values),
                setProperty: (key, value) => values.set(key, value),
                deleteProperty(key) {
                    counts.deletedProperties += 1;
                    values.delete(key);
                }
            })
        },
        loadSyncStatus_() {
            counts.status += 1;
            return { revision };
        },
        loadSnapshot_() {
            counts.snapshot += 1;
            return { data: { data: { tasks } } };
        }
    };

    vm.createContext(context);
    vm.runInContext(source, context);
    context.getReminderCalendar_ = () => calendar;

    return {
        context,
        counts,
        setRevision: value => { revision = value; }
    };
}

test("sin cambios remotos evita releer tareas y tocar Calendar", () => {
    const tasks = Array.from({ length: 341 }, (_, index) => ({
        id: `task-${index}`,
        status: "PENDING",
        reminder: null
    }));
    const { context, counts } = harness(tasks);

    context.syncCalendarReminders();
    const second = context.syncCalendarReminders();

    assert.equal(counts.status, 2);
    assert.equal(counts.snapshot, 1);
    assert.equal(counts.deletedProperties, 0);
    assert.equal(counts.createdEvents, 0);
    assert.equal(second.unchanged, true);
});

test("una revisión nueva no reescribe recordatorios sin cambios", () => {
    const task = {
        id: "task-1",
        title: "Reunión",
        status: "PENDING",
        reminder: {
            type: "at",
            at: "2099-01-01T12:00:00.000Z"
        }
    };
    const { context, counts, setRevision } = harness([task]);

    context.syncCalendarReminders();
    setRevision(2);
    context.syncCalendarReminders();

    assert.equal(counts.snapshot, 2);
    assert.equal(counts.createdEvents, 1);
    assert.equal(counts.fetchedEvents, 0);

    task.title = "Reunión modificada";
    setRevision(3);
    context.syncCalendarReminders();

    assert.equal(counts.createdEvents, 1);
    assert.equal(counts.fetchedEvents, 1);
});
