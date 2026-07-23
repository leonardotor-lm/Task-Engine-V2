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

                        <div>

                            <span
                                style="
                                    display:inline-block;
                                    width:12px;
                                    height:12px;
                                    border-radius:50%;
                                    background:${escapeHtml(entity.color)};
                                    margin-right:8px;">
                            </span>

                            <strong>${escapeHtml(entity.name)}</strong>

                        </div>

                        <div>

                            <button
                                class="editEntity"
                                data-id="${escapeHtml(entity.id)}">
                                Editar
                            </button>

                            <button
                                class="deleteEntity"
                                data-id="${escapeHtml(entity.id)}">
                                Eliminar
                            </button>

                        </div>

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
