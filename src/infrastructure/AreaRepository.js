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

getById(id) {

    return this.areas.find(area => area.id === id) ?? null;

}

update(area) {

    const index = this.areas.findIndex(a => a.id === area.id);

    if (index === -1) {
        throw new Error("El área no existe.");
    }

    this.areas[index] = area;

    this.save();

}

remove(id) {

    this.areas = this.areas.filter(area => area.id !== id);

    this.save();

}
    


    replaceAll(areas) {

        this.areas = [...areas];

        this.save();

    }

}
