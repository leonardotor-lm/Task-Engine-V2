import { escapeHtml } from "./escapeHtml.js";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const RECENT_COLORS_KEY = "task-engine-recent-colors";

export class ColorSelector {

    static palette = [
        "#3b82f6",
        "#22c55e",
        "#f59e0b",
        "#ef4444",
        "#a855f7",
        "#ec4899",
        "#14b8a6",
        "#64748b",
        "#93c5fd",
        "#86efac",
        "#fde68a",
        "#fca5a5"
    ];

    static normalize(value, fallback = "#3b82f6") {

        const color = String(value ?? "").trim();

        return HEX_COLOR.test(color)
            ? color.toLowerCase()
            : fallback;

    }

    static recentColors() {

        if (typeof localStorage === "undefined") {
            return [];
        }

        try {
            const colors = JSON.parse(
                localStorage.getItem(
                    RECENT_COLORS_KEY
                ) ?? "[]"
            );

            return Array.isArray(colors)
                ? colors
                    .map(color => this.normalize(color, ""))
                    .filter(Boolean)
                    .filter(color => !this.palette.includes(color))
                    .slice(0, 12)
                : [];
        } catch {
            return [];
        }

    }

    static remember(color) {

        if (
            typeof localStorage === "undefined" ||
            this.palette.includes(color)
        ) {
            return;
        }

        const recent = [
            color,
            ...this.recentColors().filter(
                saved => saved !== color
            )
        ].slice(0, 12);

        try {
            localStorage.setItem(
                RECENT_COLORS_KEY,
                JSON.stringify(recent)
            );
        } catch {
            // El selector sigue funcionando aunque el navegador
            // no permita guardar preferencias locales.
        }

    }

    static render({
        id,
        value = "#3b82f6",
        inputClass = ""
    }) {

        const selected = this.normalize(value);
        const colors = [
            ...this.palette,
            ...this.recentColors()
        ].filter(
            (color, index, list) =>
                list.indexOf(color) === index
        );

        return `
            <div class="colorSelector" data-color-selector>
                <input
                    id="${escapeHtml(id)}"
                    class="${escapeHtml(inputClass)}"
                    type="hidden"
                    value="${escapeHtml(selected)}"
                    data-color-value>

                <details class="colorSelectorPanel">
                    <summary
                        aria-label="Elegir color"
                        title="Elegir color">
                        <span
                            class="colorSelectorPreview"
                            style="--selected-color: ${escapeHtml(selected)}">
                        </span>
                        <span>Color</span>
                    </summary>

                    <div class="colorSelectorContent">
                        <div
                            class="colorSelectorPalette"
                            aria-label="Paleta de colores">
                            ${colors.map(color => `
                                <button
                                    type="button"
                                    class="colorSwatch"
                                    data-color="${escapeHtml(color)}"
                                    style="--swatch-color: ${escapeHtml(color)}"
                                    aria-label="Usar color ${escapeHtml(color)}"
                                    aria-pressed="${color === selected}">
                                </button>
                            `).join("")}
                        </div>

                        <label class="colorSelectorCustom">
                            <span>Color personalizado</span>
                            <span class="colorSelectorCustomControls">
                                <input
                                    type="color"
                                    class="colorSelectorNative"
                                    value="${escapeHtml(selected)}"
                                    aria-label="Abrir selector visual de color"
                                    title="Elegir visualmente">
                                <input
                                    type="text"
                                    class="colorSelectorHex"
                                    value="${escapeHtml(selected)}"
                                    maxlength="7"
                                    inputmode="text"
                                    spellcheck="false"
                                    aria-describedby="${escapeHtml(id)}ColorHelp">
                            </span>
                        </label>
                        <small id="${escapeHtml(id)}ColorHelp">
                            Usá un código hexadecimal, por ejemplo #3b82f6.
                        </small>
                    </div>
                </details>
            </div>
        `;

    }

    static bind(root = document) {

        root.querySelectorAll(
            "[data-color-selector]"
        ).forEach(selector => {

            const valueInput = selector.querySelector(
                "[data-color-value]"
            );
            const hexInput = selector.querySelector(
                ".colorSelectorHex"
            );
            const preview = selector.querySelector(
                ".colorSelectorPreview"
            );
            const nativeInput = selector.querySelector(
                ".colorSelectorNative"
            );
            const panel = selector.querySelector(
                ".colorSelectorPanel"
            );

            const select = (rawColor, remember = false) => {
                const color = this.normalize(rawColor, "");

                if (!color) {
                    hexInput.setAttribute(
                        "aria-invalid",
                        "true"
                    );
                    return false;
                }

                valueInput.value = color;
                hexInput.value = color;
                nativeInput.value = color;
                hexInput.removeAttribute("aria-invalid");
                preview.style.setProperty(
                    "--selected-color",
                    color
                );

                selector.querySelectorAll(
                    ".colorSwatch"
                ).forEach(button => {
                    button.setAttribute(
                        "aria-pressed",
                        String(button.dataset.color === color)
                    );
                });

                if (remember) this.remember(color);
                return true;
            };

            selector.querySelectorAll(
                ".colorSwatch"
            ).forEach(button => {
                button.addEventListener("click", () => {
                    select(button.dataset.color);
                    panel.removeAttribute("open");
                });
            });

            hexInput.addEventListener("input", () => {
                select(hexInput.value);
            });

            hexInput.addEventListener("change", () => {
                if (select(hexInput.value, true)) {
                    panel.removeAttribute("open");
                } else {
                    hexInput.value = valueInput.value;
                    hexInput.removeAttribute("aria-invalid");
                }
            });

            nativeInput.addEventListener("input", () => {
                select(nativeInput.value);
            });

            nativeInput.addEventListener("change", () => {
                select(nativeInput.value, true);
            });

        });

    }

}
