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
            documentRef = globalThis.document,
            MutationObserverRef =
                globalThis.MutationObserver
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.MutationObserverRef =
            MutationObserverRef;
        this.observer = null;
        this.unsubscribe = null;
        this.settingsNavigationHandler = null;

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
                    this.renderControl();
                }
            );

        this.renderControl();
        this.bindSettingsNavigation();

        const appRoot =
            this.document.getElementById?.("app");

        if (
            appRoot &&
            typeof this.MutationObserverRef ===
                "function"
        ) {

            this.observer =
                new this.MutationObserverRef(() => {
                    this.renderControl();
                });

            this.observer.observe(appRoot, {
                childList: true,
                subtree: true
            });

        }

    }

    bindSettingsNavigation() {

        if (
            this.settingsNavigationHandler ||
            typeof this.document.addEventListener !==
                "function"
        ) {
            return;
        }

        this.settingsNavigationHandler = event => {

            const button = event.target?.closest?.(
                '.openSettingsSection[data-section="application"]'
            );

            if (!button) return;

            queueMicrotask(() => {
                this.renderControl();
            });

        };

        this.document.addEventListener(
            "click",
            this.settingsNavigationHandler
        );

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
