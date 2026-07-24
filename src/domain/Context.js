export class Context {

    constructor(data = {}) {

        this.id = data.id ?? crypto.randomUUID();

        const name = (data.name ?? "").trim();

        if (!name) {
            throw new Error("El nombre del contexto no puede estar vacío.");
        }

        this.name = name;

        this.color = data.color ?? "#22c55e";

        this.order = data.order ?? 0;

        const version = data.version ?? 1;

        if (
            !Number.isInteger(version) ||
            version < 1
        ) {
            throw new Error(
                "La versión de la contexto es inválida."
            );
        }

        this.version = version;

        this.createdAt = data.createdAt ?? new Date().toISOString();

        this.updatedAt = data.updatedAt ?? this.createdAt;

    }

    touch() {

        this.version += 1;

        this.updatedAt = new Date().toISOString();

    }

    update(data = {}) {

        if (data.name !== undefined) {

            const name = data.name.trim();

            if (!name) {
                throw new Error("El nombre del contexto no puede estar vacío.");
            }

            this.name = name;

        }

        if (data.color !== undefined) {
            this.color = data.color;
        }

        if (data.order !== undefined) {
            this.order = data.order;
        }

        this.touch();

    }

    toJSON() {

        return {

            id: this.id,
            name: this.name,
            color: this.color,
            order: this.order,
            version: this.version,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt

        };

    }

}