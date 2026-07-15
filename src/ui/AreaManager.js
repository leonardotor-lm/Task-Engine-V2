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

                <ul class="areaList">
        `;

        for (const area of areas) {

            html += `
                <li class="areaItem" data-id="${area.id}">

                    <div>

                        <span
                            style="
                                display:inline-block;
                                width:12px;
                                height:12px;
                                border-radius:50%;
                                background:${area.color};
                                margin-right:8px;">
                        </span>

                        <strong>${area.name}</strong>

                    </div>

                    <div>

                        <button
                            class="editArea"
                            data-id="${area.id}">
                            Editar
                        </button>

                        <button
                            class="deleteArea"
                            data-id="${area.id}">
                            Eliminar
                        </button>

                    </div>

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
