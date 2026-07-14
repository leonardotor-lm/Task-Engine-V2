export class AreaManager {

    render(areas = []) {

        let html = `
            <main class="content">

                <h2>Áreas</h2>

                <form id="areaForm">

                    <input
                        id="areaName"
                        type="text"
                        placeholder="Nueva área"
                        autocomplete="off">

                    <input
                        id="areaColor"
                        type="color"
                        value="#3b82f6">

                    <button type="submit">
                        Crear
                    </button>

                </form>

                <hr>

                <ul>
        `;

        for (const area of areas) {

            html += `
                <li data-id="${area.id}">

                    <span
                        style="
                            display:inline-block;
                            width:12px;
                            height:12px;
                            border-radius:50%;
                            background:${area.color};
                            margin-right:8px;">
                    </span>

                    ${area.name}

                    <button class="editArea" data-id="${area.id}">
                        Editar
                    </button>

                    <button class="deleteArea" data-id="${area.id}">
                        Eliminar
                    </button>

                </li>
            `;
        }

        html += `
                </ul>

            </main>
        `;

        return html;

    }

}
