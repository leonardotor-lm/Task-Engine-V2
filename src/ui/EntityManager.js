import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";

export class EntityManager {

    render(title, entities = []) {

        const createLabels = {
            "Áreas": "Nueva área",
            "Contextos": "Nuevo contexto",
            "Etiquetas": "Nueva etiqueta"
        };

        const createLabel =
            createLabels[title] ??
            "Nuevo elemento";

        let html = `
            <main class="content entityManager">

                <h2>${escapeHtml(title)}</h2>

                <details class="entityCreateManager">

                    <summary>
                        ${Icon.render(
                            "plus",
                            "entityCreateIcon"
                        )}
                        <span>${escapeHtml(createLabel)}</span>
                    </summary>

                    <form id="entityForm">

                        <input
                            id="entityName"
                            type="text"
                            placeholder="Nombre"
                            aria-label="Nombre"
                            autocomplete="off">

                        <input
                            id="entityColor"
                            type="color"
                            value="#3b82f6"
                            aria-label="Color">

                        <button type="submit">
                            Crear
                        </button>

                    </form>

                </details>
        `;

        if (entities.length === 0) {

            html += `
                <p class="emptyState">
                    No hay elementos para mostrar en esta vista.
                </p>
            `;

        } else {

            html += `
                <ul class="entityList">
            `;

            for (const entity of entities) {

                html += `
                    <li
                        class="entityItem"
                        data-id="${escapeHtml(entity.id)}">

                        <div class="entityDisplay">

                            <div class="entityIdentity">

                                <span
                                    class="entityColorSample"
                                    style="--entity-color: ${escapeHtml(entity.color)}">
                                </span>

                                <strong>${escapeHtml(entity.name)}</strong>

                            </div>

                            <div class="entityActions">

                                <button
                                    type="button"
                                    class="editEntity iconButton"
                                    data-id="${escapeHtml(entity.id)}"
                                    aria-label="Editar ${escapeHtml(entity.name)}"
                                    title="Editar">
                                    ${Icon.render("edit")}
                                </button>

                                <button
                                    type="button"
                                    class="deleteEntity"
                                    data-id="${escapeHtml(entity.id)}">
                                    Eliminar
                                </button>

                            </div>

                        </div>

                        <form
                            class="entityEditForm"
                            data-id="${escapeHtml(entity.id)}"
                            hidden>

                            <input
                                class="entityEditName"
                                type="text"
                                value="${escapeHtml(entity.name)}"
                                aria-label="Nombre"
                                autocomplete="off"
                                required>

                            <input
                                class="entityEditColor"
                                type="color"
                                value="${escapeHtml(entity.color)}"
                                aria-label="Color">

                            <button
                                type="button"
                                class="saveEntityEdit">
                                Guardar
                            </button>

                            <button
                                type="button"
                                class="cancelEntityEdit">
                                Cancelar
                            </button>

                        </form>

                    </li>
                `;

            }

            html += `
                </ul>
            `;

        }

        html += `
            </main>
        `;

        return html;

    }

}
