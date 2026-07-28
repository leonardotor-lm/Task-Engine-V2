export class CustomFilter {

    constructor(data = {}) {

        this.id =
            data.id ??
            crypto.randomUUID();

        this.name =
            this.validateName(data.name);

        this.query =
            this.validateQuery(data.query);

        this.version =
            Number.isInteger(data.version)
                ? data.version
                : 1;

        this.createdAt =
            data.createdAt ??
            new Date().toISOString();

        this.updatedAt =
            data.updatedAt ??
            this.createdAt;

    }

    validateName(value) {

        const name =
            String(value ?? "").trim();

        if (!name) {
            throw new Error(
                "El filtro necesita un nombre."
            );
        }

        if (name.length > 80) {
            throw new Error(
                "El nombre del filtro es demasiado largo."
            );
        }

        return name;

    }

    validateQuery(value) {

        const query =
            String(value ?? "").trim();

        if (!query) {
            throw new Error(
                "El filtro necesita una búsqueda."
            );
        }

        return query;

    }

    update(data = {}) {

        if (data.name !== undefined) {
            this.name =
                this.validateName(data.name);
        }

        if (data.query !== undefined) {
            this.query =
                this.validateQuery(data.query);
        }

        this.version += 1;
        this.updatedAt =
            new Date().toISOString();

    }

    toJSON() {

        return {
            id: this.id,
            name: this.name,
            query: this.query,
            version: this.version,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };

    }

}
