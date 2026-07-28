import { CustomFilter } from "../domain/CustomFilter.js";

const STORAGE_KEY =
    "task-engine-v2-custom-filters";

export class CustomFilterRepository {

    constructor(storage = localStorage) {

        this.storage = storage;
        this.filters = [];
        this.load();

    }

    load() {

        const json =
            this.storage.getItem(STORAGE_KEY);

        if (!json) return;

        this.filters = JSON
            .parse(json)
            .map(data =>
                new CustomFilter(data)
            );

    }

    save() {

        this.storage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                this.filters.map(
                    filter => filter.toJSON()
                )
            )
        );

    }

    getAll() {

        return [...this.filters].sort(
            (first, second) =>
                first.name.localeCompare(
                    second.name,
                    "es"
                )
        );

    }

    getById(id) {

        return this.filters.find(
            filter => filter.id === id
        ) ?? null;

    }

    add(data) {

        const filter =
            new CustomFilter(data);

        this.filters.push(filter);
        this.save();

        return filter;

    }

    update(filter) {

        const index =
            this.filters.findIndex(
                item => item.id === filter.id
            );

        if (index === -1) {
            throw new Error(
                "El filtro no existe."
            );
        }

        this.filters[index] = filter;
        this.save();

    }

    remove(id) {

        this.filters =
            this.filters.filter(
                filter => filter.id !== id
            );

        this.save();

    }

    replaceAll(filters) {

        this.filters = [...filters];
        this.save();

    }

}
