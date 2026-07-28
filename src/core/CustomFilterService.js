import {
    compileAdvancedSearch
} from "./AdvancedSearch.js";
import {
    CustomFilterRepository
} from "../infrastructure/CustomFilterRepository.js";

export class CustomFilterService {

    constructor(
        repository =
            new CustomFilterRepository()
    ) {

        this.repository = repository;

    }

    getAllFilters() {

        return this.repository.getAll();

    }

    getFilterById(id) {

        return this.repository.getById(id);

    }

    createFilter(data) {

        compileAdvancedSearch(data.query);

        const name =
            String(data.name ?? "").trim();

        if (
            this.repository.getAll().some(
                filter =>
                    filter.name
                        .toLocaleLowerCase("es") ===
                    name.toLocaleLowerCase("es")
            )
        ) {
            throw new Error(
                "Ya existe un filtro con ese nombre."
            );
        }

        return this.repository.add({
            ...data,
            name
        });

    }

    updateFilter(id, data) {

        const filter =
            this.repository.getById(id);

        if (!filter) {
            throw new Error(
                "El filtro no existe."
            );
        }

        if (data.query !== undefined) {
            compileAdvancedSearch(
                data.query
            );
        }

        filter.update(data);
        this.repository.update(filter);

        return filter;

    }

    deleteFilter(id) {

        const filter =
            this.repository.getById(id);

        if (!filter) {
            return false;
        }

        this.repository.remove(id);

        return true;

    }

}
