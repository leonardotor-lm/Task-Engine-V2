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

        const areas = this.getAllAreas();
        const nextOrder = areas.length === 0
            ? 0
            : Math.max(
                ...areas.map(area => area.order)
            ) + 1;

        return this.repository.add({
            ...data,
            order: data.order ?? nextOrder
        });

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


    moveArea(id, direction) {

        if (!["UP", "DOWN"].includes(direction)) {
            throw new Error(
                "La dirección del área es inválida."
            );
        }

        const areas = this.getAllAreas();
        const currentIndex = areas.findIndex(
            area => area.id === id
        );

        if (currentIndex === -1) {
            throw new Error("Área inexistente.");
        }

        const targetIndex = currentIndex +
            (direction === "UP" ? -1 : 1);

        if (
            targetIndex < 0 ||
            targetIndex >= areas.length
        ) {
            return areas;
        }

        [areas[currentIndex], areas[targetIndex]] =
            [areas[targetIndex], areas[currentIndex]];

        areas.forEach((area, index) => {
            if (area.order !== index) {
                area.update({ order: index });
            }
        });

        this.repository.replaceAll(areas);

        return this.getAllAreas();

    }

}
