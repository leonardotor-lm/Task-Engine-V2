import { AreaRepository } from "../infrastructure/AreaRepository.js";

export class AreaService {

    constructor() {

        this.repository = new AreaRepository();

    }

    getAllAreas() {

        return this.repository.getAll();

    }

    createArea(data) {

        return this.repository.add(data);

    }

}
