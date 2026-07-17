import { ContextRepository } from "../infrastructure/ContextRepository.js";

export class ContextService {

    constructor() {

        this.repository = new ContextRepository();

    }

    getAllContexts() {

        return this.repository.getAll();

    }

    getContextById(id) {

        return this.repository.getById(id);

    }

    createContext(data) {

        return this.repository.add(data);

    }

    updateContext(id, data) {

        const context = this.repository.getById(id);

        if (!context) {
            throw new Error("Contexto inexistente.");
        }

        context.update(data);

        this.repository.update(context);

    }

    deleteContext(id) {

        this.repository.remove(id);

    }

}
