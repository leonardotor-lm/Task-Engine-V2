import { Tag } from "../domain/Tag.js";

const STORAGE_KEY = "task-engine-v2-tags";

export class TagRepository {

    constructor() {

        this.tags = [];
        this.load();

    }

    load() {

        const json = localStorage.getItem(STORAGE_KEY);

        if (!json) return;

        this.tags = JSON.parse(json).map(data => new Tag(data));

    }

    save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.tags.map(tag => tag.toJSON()))
        );

    }

    getAll() {

        return [...this.tags].sort((a, b) => a.order - b.order);

    }

    getById(id) {

        return this.tags.find(tag => tag.id === id) ?? null;

    }

    add(data) {

        const tag = new Tag(data);

        this.tags.push(tag);
        this.save();

        return tag;

    }

    update(tag) {

        const index = this.tags.findIndex(item => item.id === tag.id);

        if (index === -1) {
            throw new Error("La etiqueta no existe.");
        }

        this.tags[index] = tag;
        this.save();

    }

    remove(id) {

        this.tags = this.tags.filter(tag => tag.id !== id);
        this.save();

    }

}
