export class Sidebar {

    render() {

        return `
            <aside class="sidebar">

                <h3>Task Engine</h3>

                <nav>

                    <button id="showTasks">
                        📥 Inbox
                    </button>

                    <button>
                        📅 Hoy
                    </button>

                    <button>
                        📆 Próximas
                    </button>

                    <button>
                        📋 Todas
                    </button>

                    <hr>

                    <button id="manageAreas">
                        ⚙️ Áreas
                    </button>

                    <button id="manageContexts">
                        ⚙️ Contextos
                    </button>

                </nav>

            </aside>
        `;

    }

}