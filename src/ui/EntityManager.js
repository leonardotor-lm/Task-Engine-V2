import { escapeHtml } from "./escapeHtml.js";

export class EntityManager {

    render(title, entities = []) {

        let html = `
            <main class="content">

                <h2>${escapeHtml(title)}</h2>

                <form id="entityForm">

                    <input
                        id="entityName"
                        type="text"
                        placeholder="Nombre"
                        autocomplete="off">

                    <input
                        id="entityColor"
                        type="color"
                        value="#3b82f6">

                    <button type="submit">
                        Crear
                    </button>

                </form>

                <hr>
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
                                    class="editEntity"
                                    data-id="${escapeHtml(entity.id)}">
                                    Editar
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

                            <button type="submit">
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
