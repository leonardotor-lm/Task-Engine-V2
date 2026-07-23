export class Sidebar {

    render() {

        return `
            <aside class="sidebar">

                <h3>Task Engine</h3>

                <nav>

                    <button id="showInbox">
                        📥 Inbox
                    </button>

                    <button id="showToday">
                        📅 Hoy
                    </button>

                    <button id="showUpcoming">
                        📆 Próximas
                    </button>

                    <button id="showAll">
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