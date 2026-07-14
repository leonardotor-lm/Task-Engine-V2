import { Area } from "../domain/Area.js";

const STORAGE_KEY = "task-engine-v2-areas";

export class AreaRepository {

    constructor() {

        this.areas = [];

        this.load();

    }

    load() {

        const json = localStorage.getItem(STORAGE_KEY);

        if (!json) return;

        this.areas = JSON.parse(json).map(a => new Area(a));

    }

    save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.areas.map(a => a.toJSON()))
        );

    }

    getAll() {

        return [...this.areas].sort((a, b) => a.order - b.order);

    }

    add(data) {

        const area = new Area(data);

        this.areas.push(area);

        this.save();

        return area;

    }

}
