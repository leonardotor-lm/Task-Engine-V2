import { AreaRepository } from "../infrastructure/AreaRepository.js";

export class AreaService {

    constructor() {

        this.repository = new AreaRepository();

    }

    getAllAreas() {

        return this.repository.getAll();

    }

    getAreaById(id) {

        return this.repository.getById(id);

    }

    createArea(data) {

        return this.repository.add(data);

    }

    updateArea(id, data) {

        const area = this.repository.getById(id);

        if (!area) {
            throw new Error("Área inexistente.");
        }

        area.update(data);

        this.repository.update(area);

    }

    deleteArea(id) {

        this.repository.remove(id);

    }

}
