import {
    ActivityEvent
} from "../domain/ActivityEvent.js";

const STORAGE_KEY =
    "task-engine-v2-activity-events";

export class ActivityRepository {

    constructor(storage = localStorage) {

        this.storage = storage;
        this.events = [];
        this.load();

    }

    load() {

        const json = this.storage.getItem(
            STORAGE_KEY
        );

        if (!json) return;

        this.events = JSON.parse(json)
            .map(data => new ActivityEvent(data));

    }

    save() {

        this.storage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                this.events.map(event =>
                    event.toJSON()
                )
            )
        );

    }

    add(data) {

        const event = new ActivityEvent(data);
        this.events.push(event);
        this.save();
        return event;

    }

    getAll() {

        return [...this.events];

    }

    replaceAll(events) {

        this.events = [...events];
        this.save();

    }

}
