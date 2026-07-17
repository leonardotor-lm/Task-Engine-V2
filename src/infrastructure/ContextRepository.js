import { Context } from "../domain/Context.js";

const STORAGE_KEY = "task-engine-contexts";

export class ContextRepository {

    constructor() {

        this.contexts = this.load();

    }

    load() {

        const json = localStorage.getItem(STORAGE_KEY);

        if (!json) {
            return [];
        }

        return JSON.parse(json).map(data => new Context(data));

    }

    save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.contexts)
        );

    }

    getAll() {

        return [...this.contexts];

    }

    add(data) {

        const context = new Context(data);

        this.contexts.push(context);

        this.save();

        return context;

    }

    getById(id) {

        return this.contexts.find(context => context.id === id) ?? null;

    }

    update(context) {

        const index = this.contexts.findIndex(c => c.id === context.id);

        if (index === -1) {
            throw new Error("El contexto no existe.");
        }

        this.contexts[index] = context;

        this.save();

    }

    remove(id) {

        this.contexts = this.contexts.filter(context => context.id !== id);

        this.save();

    }

}
