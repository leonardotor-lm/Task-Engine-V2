const AVAILABLE_THEMES = Object.freeze([
    {
        id: "default",
        label: "Predeterminado"
    },
    {
        id: "paper",
        label: "Papel"
    },
    {
        id: "high-contrast",
        label: "Alto contraste"
    },
    {
        id: "ink-blue",
        label: "Azul tinta"
    },
    {
        id: "rose",
        label: "Rosa"
    },
    {
        id: "dark",
        label: "Oscuro"
    },
    {
        id: "retro-dark",
        label: "Retro Dark"
    },
    {
        id: "retro-dark-2",
        label: "Retro Dark 2"
    },
    {
        id: "terminal-80",
        label: "Terminal 80"
    }
]);

const INSTALL_TOOLS_MARKER =
    '<div class="applicationInstallTools">';

export class ThemeController {

    constructor(
        app,
        {
            documentRef = globalThis.document
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.unsubscribe = null;
        this.originalSidebarRender = null;
        this.changeHandler = null;

    }

    start() {

        const preferences =
            this.app?.taskDisplayPreferences;

        if (!preferences || !this.document) {
            return;
        }

        this.applyTheme(
            preferences.getTheme()
        );

        this.unsubscribe =
            preferences.subscribeToTheme(
                theme => {
                    this.applyTheme(theme);
                }
            );

        this.wrapSidebarRender();
        this.bindThemeSelection();

    }

    wrapSidebarRender() {

        const sidebar = this.app?.mainView?.sidebar;

        if (
            this.originalSidebarRender ||
            typeof sidebar?.render !== "function"
        ) {
            return;
        }

        this.originalSidebarRender =
            sidebar.render.bind(sidebar);

        sidebar.render = (...args) => {

            const html =
                this.originalSidebarRender(...args);

            if (!html.includes(INSTALL_TOOLS_MARKER)) {
                return html;
            }

            return html.replace(
                INSTALL_TOOLS_MARKER,
                `${this.renderThemeControl()}\n\n                ${INSTALL_TOOLS_MARKER}`
            );

        };

    }

    renderThemeControl() {

        const selectedTheme =
            this.app.taskDisplayPreferences
                .getTheme();

        return `
            <div
                id="themePreferenceControl"
                class="applicationThemeTools">

                <h3>Apariencia</h3>

                <label for="applicationTheme">
                    Tema visual
                </label>

                <select id="applicationTheme">
                    ${AVAILABLE_THEMES.map(theme => `
                        <option
                            value="${theme.id}"
                            ${theme.id === selectedTheme
                                ? "selected"
                                : ""}>
                            ${theme.label}
                        </option>
                    `).join("")}
                </select>

                <p class="settingsHint">
                    El tema cambia la apariencia sin alterar la estructura ni los datos de la aplicación.
                </p>

            </div>
        `;

    }

    bindThemeSelection() {

        if (
            this.changeHandler ||
            typeof this.document.addEventListener !==
                "function"
        ) {
            return;
        }

        this.changeHandler = event => {

            if (event.target?.id !== "applicationTheme") {
                return;
            }

            this.app.taskDisplayPreferences
                .setTheme(event.target.value);

            this.app?.render?.();

        };

        this.document.addEventListener(
            "change",
            this.changeHandler
        );

    }

    applyTheme(theme) {

        const root = this.document?.documentElement;

        if (!root) return;

        root.dataset.theme = theme;

    }

}
