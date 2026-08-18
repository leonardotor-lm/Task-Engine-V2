const AVAILABLE_THEMES = Object.freeze([
    {
        id: "default",
        label: "Predeterminado"
    }
]);

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
        this.originalMainViewRender = null;

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

        this.wrapMainViewRender();
        this.renderControl();

    }

    wrapMainViewRender() {

        const mainView = this.app?.mainView;

        if (
            this.originalMainViewRender ||
            typeof mainView?.render !== "function"
        ) {
            return;
        }

        this.originalMainViewRender =
            mainView.render.bind(mainView);

        mainView.render = (...args) => {

            const result =
                this.originalMainViewRender(...args);

            this.renderControl();

            return result;

        };

    }

    applyTheme(theme) {

        const root = this.document?.documentElement;

        if (!root) return;

        root.dataset.theme = theme;

    }

    renderControl() {

        const preferences =
            this.app?.taskDisplayPreferences;
        const applicationTools =
            this.document?.querySelector?.(
                ".applicationTools"
            );

        if (!preferences || !applicationTools) {
            return;
        }

        const existing =
            this.document.getElementById?.(
                "themePreferenceControl"
            );

        if (existing) {

            const select =
                this.document.getElementById?.(
                    "applicationTheme"
                );

            if (select) {
                select.value = preferences.getTheme();
            }

            return;
        }

        const control =
            this.document.createElement("div");

        control.id = "themePreferenceControl";
        control.className =
            "applicationThemeTools";

        control.innerHTML = `
            <h3>Apariencia</h3>

            <label for="applicationTheme">
                Tema visual
            </label>

            <select id="applicationTheme">
                ${AVAILABLE_THEMES.map(theme => `
                    <option value="${theme.id}">
                        ${theme.label}
                    </option>
                `).join("")}
            </select>

            <p class="settingsHint">
                Los próximos temas usarán esta misma preferencia sin cambiar la estructura de la aplicación.
            </p>
        `;

        const installTools =
            applicationTools.querySelector(
                ".applicationInstallTools"
            );

        applicationTools.insertBefore(
            control,
            installTools ?? null
        );

        const select =
            control.querySelector(
                "#applicationTheme"
            );

        if (!select) return;

        select.value = preferences.getTheme();

        select.addEventListener(
            "change",
            event => {
                preferences.setTheme(
                    event.target.value
                );
                this.app?.render?.();
            }
        );

    }

}
