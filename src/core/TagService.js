import { TagRepository } from "../infrastructure/TagRepository.js";

export class TagService {

    constructor() {

        this.repository = new TagRepository();

    }

    getAllTags() {

        return this.repository.getAll();

    }

    getTagById(id) {

        return this.repository.getById(id);

    }

    createTag(data) {

        return this.repository.add(data);

    }

    updateTag(id, data) {

        const tag = this.repository.getById(id);

        if (!tag) {
            throw new Error("Etiqueta inexistente.");
        }

        tag.update(data);
        this.repository.update(tag);

    }

    deleteTag(id) {

        this.repository.remove(id);

    }

}
