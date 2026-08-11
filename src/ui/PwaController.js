export class PwaController {

    constructor(
        app,
        {
            windowRef = globalThis.window,
            documentRef = globalThis.document,
            navigatorRef = globalThis.navigator
        } = {}
    ) {

        this.app = app;
        this.window = windowRef;
        this.document = documentRef;
        this.navigator = navigatorRef;
        this.deferredPrompt = null;
        this.installationCompleted = false;
        this.registrationPromise = null;
        this.started = false;

    }

    start() {

        if (this.started) return;

        this.started = true;
        this.bindBrowserEvents();
        this.wrapRender();
        this.registerServiceWorker();

    }

    bindBrowserEvents() {

        this.window?.addEventListener?.(
            "beforeinstallprompt",
            event => {

                event.preventDefault();
                this.deferredPrompt = event;
                this.applyInstallState();

            }
        );

        this.window?.addEventListener?.(
            "appinstalled",
            () => {

                this.deferredPrompt = null;
                this.installationCompleted = true;
                this.applyInstallState();

            }
        );

    }

    wrapRender() {

        const mainView = this.app?.mainView;

        if (!mainView?.render) return;

        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);
            this.applyInstallState();

        };

    }

    registerServiceWorker() {

        if (!this.navigator?.serviceWorker) {
            return Promise.resolve(null);
        }

        if (this.registrationPromise) {
            return this.registrationPromise;
        }

        this.registrationPromise =
            this.navigator.serviceWorker
                .register("./service-worker.js")
                .catch(error => {

                    console.warn(
                        "No se pudo activar el funcionamiento sin conexión.",
                        error
                    );

                    return null;

                });

        return this.registrationPromise;

    }

    isInstalled() {

        return Boolean(
            this.installationCompleted ||
            this.window?.matchMedia?.(
                "(display-mode: standalone)"
            )?.matches ||
            this.navigator?.standalone
        );

    }

    applyInstallState() {

        const button = this.document?.getElementById?.(
            "installApp"
        );
        const description =
            this.document?.getElementById?.(
                "pwaInstallDescription"
            );

        if (!button || !description) return;

        if (this.isInstalled()) {
            description.textContent =
                "La aplicación ya está instalada en este dispositivo.";
            button.hidden = true;
            return;
        }

        button.hidden = !this.deferredPrompt;
        button.disabled = !this.deferredPrompt;
        button.textContent = "Instalar aplicación";
        button.addEventListener(
            "click",
            () => this.requestInstall(),
            { once: true }
        );

        description.textContent = this.deferredPrompt
            ? "Instalá Mis tareas para abrirla desde la pantalla de inicio y usar los datos guardados aun cuando no haya conexión."
            : "Si el botón no está disponible, abrí el menú del navegador y elegí “Instalar aplicación” o “Agregar a pantalla principal”.";

    }

    async requestInstall() {

        if (!this.deferredPrompt) return null;

        const prompt = this.deferredPrompt;
        this.deferredPrompt = null;
        await prompt.prompt();
        const choice = await prompt.userChoice;

        if (choice?.outcome === "accepted") {
            this.installationCompleted = true;
        }

        this.applyInstallState();

        return choice;

    }

}
