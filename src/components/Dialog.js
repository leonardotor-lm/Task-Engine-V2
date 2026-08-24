import { escapeHtml } from "../ui/escapeHtml.js";
import { Icon } from "../ui/Icon.js";

export class Dialog {

    static nextId = 0;

    static alert(message, options = {}) {

        if (typeof document === "undefined") {
            alert(message);
            return Promise.resolve(true);
        }

        return this.open({
            title: options.title ?? "Aviso",
            message,
            confirmLabel: options.confirmLabel ?? "Aceptar",
            variant: options.variant ?? "info"
        });

    }

    static confirmAsync(message, options = {}) {

        if (typeof document === "undefined") {
            return Promise.resolve(confirm(message));
        }

        return this.open({
            title: options.title ?? "Confirmar acción",
            message,
            confirmLabel: options.confirmLabel ?? "Confirmar",
            cancelLabel: options.cancelLabel ?? "Cancelar",
            variant: options.variant ?? "confirm"
        });

    }

    static promptAsync(message, options = {}) {

        if (typeof document === "undefined") {
            const value = prompt(
                message,
                options.defaultValue ?? ""
            );

            return Promise.resolve(
                value === null ? null : value.trim()
            );
        }

        return this.open({
            title: options.title ?? "Ingresar un nombre",
            message,
            confirmLabel: options.confirmLabel ?? "Guardar",
            cancelLabel: options.cancelLabel ?? "Cancelar",
            variant: options.variant ?? "prompt",
            input: true,
            defaultValue: options.defaultValue ?? "",
            inputLabel: options.inputLabel ?? "Nombre"
        });

    }

    static chooseAsync(message, options = {}) {

        if (typeof document === "undefined") {
            return Promise.resolve(null);
        }

        return this.open({
            title: options.title ?? "Elegir una acción",
            message,
            cancelLabel: options.cancelLabel ?? "Cancelar",
            variant: options.variant ?? "confirm",
            choices: options.choices ?? []
        });

    }

    static render({
        id,
        title,
        message,
        confirmLabel,
        cancelLabel = null,
        variant = "info",
        input = false,
        defaultValue = "",
        inputLabel = "Valor",
        choices = []
    }) {

        const destructive = variant === "danger";

        return `
            <dialog
                id="${escapeHtml(id)}"
                class="appDialog appDialog--${escapeHtml(variant)}"
                aria-labelledby="${escapeHtml(id)}Title"
                aria-describedby="${escapeHtml(id)}Message">
                <header class="appDialogHeader">
                    <h2 id="${escapeHtml(id)}Title">
                        ${escapeHtml(title)}
                    </h2>
                    <button
                        type="button"
                        class="iconButton appDialogClose"
                        data-dialog-action="cancel"
                        aria-label="Cerrar"
                        title="Cerrar">
                        ${Icon.render("close")}
                    </button>
                </header>
                <div class="appDialogBody">
                    <p id="${escapeHtml(id)}Message">
                        ${escapeHtml(message)}
                    </p>
                    ${input
                        ? `
                            <label class="appDialogInputLabel">
                                <span>${escapeHtml(inputLabel)}</span>
                                <input
                                    class="appDialogInput"
                                    data-dialog-input
                                    type="text"
                                    value="${escapeHtml(defaultValue)}"
                                    autocomplete="off">
                            </label>
                        `
                        : ""}
                </div>
                <footer class="appDialogActions">
                    ${cancelLabel
                        ? `
                            <button
                                type="button"
                                class="secondaryAction"
                                data-dialog-action="cancel">
                                ${escapeHtml(cancelLabel)}
                            </button>
                        `
                        : ""}
                    ${choices.length > 0
                        ? choices.map(choice => `
                            <button
                                type="button"
                                class="${choice.variant === "danger"
                                    ? "dangerAction"
                                    : choice.variant === "primary"
                                        ? "primaryAction"
                                        : "secondaryAction"}"
                                data-dialog-value="${escapeHtml(choice.value)}">
                                ${escapeHtml(choice.label)}
                            </button>
                        `).join("")
                        : `
                            <button
                                type="button"
                                class="${destructive
                                    ? "dangerAction"
                                    : "primaryAction"}"
                                data-dialog-action="confirm">
                                ${escapeHtml(confirmLabel)}
                            </button>
                        `}
                </footer>
            </dialog>
        `;

    }

    static open(options) {

        const id = `appDialog${++this.nextId}`;
        const host = document.createElement("div");
        const previousFocus = document.activeElement;

        host.innerHTML = this.render({
            ...options,
            id
        });

        const dialog = host.firstElementChild;
        document.body.append(dialog);

        return new Promise(resolve => {

            let finished = false;

            const finish = value => {
                if (finished) return;
                finished = true;
                dialog.close();
                dialog.remove();

                if (
                    previousFocus &&
                    previousFocus !== document.body &&
                    previousFocus.isConnected &&
                    typeof previousFocus.focus === "function"
                ) {
                    previousFocus.focus();
                }

                resolve(value);
            };

            const input = dialog.querySelector(
                "[data-dialog-input]"
            );

            dialog.querySelectorAll(
                "[data-dialog-action], [data-dialog-value]"
            ).forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        if (
                            button.dataset.dialogValue !==
                            undefined
                        ) {
                            finish(
                                button.dataset.dialogValue
                            );
                            return;
                        }

                        const confirmed =
                            button.dataset.dialogAction ===
                            "confirm";

                        finish(
                            input
                                ? confirmed
                                    ? input.value.trim()
                                    : null
                                : confirmed
                        );
                    }
                );
            });

            dialog.addEventListener("cancel", event => {
                event.preventDefault();
                finish(options.choices ? null : false);
            });

            dialog.addEventListener("click", event => {
                if (event.target === dialog) {
                    finish(
                        options.choices
                            ? null
                            : false
                    );
                }
            });

            input?.addEventListener("keydown", event => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                finish(input.value.trim());
            });

            dialog.showModal();

            const initialFocus =
                input ?? (options.cancelLabel
                    ? dialog.querySelector(
                        '.appDialogActions [data-dialog-action="cancel"]'
                    )
                    : dialog.querySelector(
                        '[data-dialog-action="confirm"]'
                    ));

            initialFocus?.focus();

        });

    }

}
