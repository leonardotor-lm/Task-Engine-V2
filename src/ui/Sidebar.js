import { View } from "../core/View.js";
import { escapeHtml } from "./escapeHtml.js";

export class Sidebar {

    render(activeView, searchQuery = "") {

        const buttonClass = view => {

            return activeView === view
                ? "sidebarButton active"
                : "sidebarButton";

        };

        return `
            <aside class="sidebar">

                <h3>Task Engine</h3>

                <form id="taskSearchForm" class="taskSearch">

                    <input
                        id="taskSearchInput"
                        type="search"
                        value="${escapeHtml(searchQuery)}"
                        placeholder="Buscar tareas"
                        autocomplete="off">

                    <div class="taskSearchActions">

                        <button type="submit">
                            Buscar
                        </button>

                        ${searchQuery
                            ? `
                                <button
                                    id="clearTaskSearch"
                                    type="button">
                                    Limpiar
                                </button>
                            `
                            : ""}

                    </div>

                </form>

                <nav>

                    <button
                        id="showInbox"
                        class="${buttonClass(View.INBOX)}">
                        📥 Inbox
                    </button>

                    <button
                        id="showToday"
                        class="${buttonClass(View.TODAY)}">
                        📅 Hoy
                    </button>

                    <button
                        id="showUpcoming"
                        class="${buttonClass(View.UPCOMING)}">
                        📆 Próximas
                    </button>

                    <button
                        id="showAll"
                        class="${buttonClass(View.ALL)}">
                        📋 Todas
                    </button>

                    <hr>

                    <button
                        id="showCompleted"
                        class="${buttonClass(View.COMPLETED)}">
                        ✅ Completadas
                    </button>

                    <button
                        id="showArchived"
                        class="${buttonClass(View.ARCHIVED)}">
                        🗄️ Archivadas
                    </button>

                    <button
                        id="showTrash"
                        class="${buttonClass(View.TRASH)}">
                        🗑️ Papelera
                    </button>

                    <hr>

                    <button
                        id="manageAreas"
                        class="${buttonClass(View.AREAS)}">
                        ⚙️ Áreas
                    </button>

                    <button
                        id="manageContexts"
                        class="${buttonClass(View.CONTEXTS)}">
                        ⚙️ Contextos
                    </button>

                    <button
                        id="manageTags"
                        class="${buttonClass(View.TAGS)}">
                        🏷️ Etiquetas
                    </button>

                </nav>

            </aside>
        `;

    }

}
