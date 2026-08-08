import { escapeHtml } from "./escapeHtml.js";
import { Icon } from "./Icon.js";

export class SearchableMultiSelect {

    render({
        id,
        label,
        options = [],
        selectedValues = [],
        valueClass,
        emptyMessage,
        compact = false,
        managerLabel = "Agregar o quitar",
        disabled = false
    }) {

        const selected = new Set(
            selectedValues.map(String)
        );

        const selectedOptions = options.filter(
            option => selected.has(String(option.value))
        );

        return `
            <fieldset
                class="searchableMultiSelect${compact
                    ? " searchableMultiSelectCompact"
                    : ""}"
                data-picker-id="${escapeHtml(id)}"
                data-value-class="${escapeHtml(valueClass)}"
                ${disabled ? "disabled" : ""}>

                <legend>${escapeHtml(label)}</legend>

                <div class="searchableMultiSelectHeader">
                    <span>
                        Seleccionadas:
                        <strong
                            id="${escapeHtml(id)}Count"
                            aria-live="polite"
                            aria-atomic="true">
                            ${selectedOptions.length}
                        </strong>
                    </span>
                </div>

                <div
                    id="${escapeHtml(id)}Selected"
                    class="searchableMultiSelectChips">
                    ${selectedOptions.length > 0
                        ? selectedOptions.map(option =>
                            this.renderChip(
                                id,
                                option,
                                valueClass,
                                disabled
                            )
                        ).join("")
                        : `
                            <span class="searchableMultiSelectEmpty">
                                Ninguna seleccionada.
                            </span>
                        `}
                </div>

                ${options.length > 0
                    ? `
                        <details class="searchableMultiSelectManager">
                            <summary>
                                ${escapeHtml(managerLabel)}
                            </summary>

                            <div class="searchableMultiSelectManagerBody">
                                <label
                                    for="${escapeHtml(id)}Search">
                                    Buscar
                                </label>
                                <input
                                    id="${escapeHtml(id)}Search"
                                    type="search"
                                    placeholder="Escribí para filtrar…"
                                    autocomplete="off">
                                <select
                                    id="${escapeHtml(id)}Options"
                                    size="${Math.min(
                                        6,
                                        Math.max(2, options.length)
                                    )}">
                                    ${options.map(option => `
                                        <option
                                            value="${escapeHtml(option.value)}"
                                            data-color="${escapeHtml(
                                                option.color ?? ""
                                            )}"
                                            data-excluded="${selected.has(
                                                String(option.value)
                                            )}">
                                            ${escapeHtml(option.label)}
                                        </option>
                                    `).join("")}
                                </select>
                                <p
                                    id="${escapeHtml(id)}NoMatches"
                                    class="searchableSelectEmpty"
                                    role="status"
                                    aria-live="polite"
                                    hidden>
                                    No hay coincidencias.
                                </p>
                                <div class="searchableMultiSelectManagerActions">
                                    <button
                                        id="${escapeHtml(id)}Add"
                                        type="button">
                                        Agregar
                                    </button>
                                    <button
                                        id="${escapeHtml(id)}Cancel"
                                        type="button"
                                        class="tertiaryAction">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </details>
                    `
                    : `
                        <span class="searchableMultiSelectUnavailable">
                            ${escapeHtml(emptyMessage)}
                        </span>
                    `}

            </fieldset>
        `;

    }

    renderChip(
        id,
        option,
        valueClass,
        disabled
    ) {

        return `
            <span
                class="searchableMultiSelectChip"
                data-value="${escapeHtml(option.value)}">
                ${option.color
                    ? `
                        <span
                            class="searchableMultiSelectColor"
                            style="background:${escapeHtml(option.color)}">
                        </span>
                    `
                    : ""}
                <span>${escapeHtml(option.label)}</span>
                ${disabled
                    ? ""
                    : `
                        <button
                            type="button"
                            class="searchableMultiSelectRemove"
                            aria-label="Quitar ${escapeHtml(option.label)}">
                            ${Icon.render(
                                "close",
                                "chipRemoveIcon"
                            )}
                        </button>
                    `}
                <input
                    type="hidden"
                    class="${escapeHtml(valueClass)}"
                    value="${escapeHtml(option.value)}">
            </span>
        `;

    }

    bind(id) {

        const root = document.querySelector(
            `[data-picker-id="${id}"]`
        );

        if (!root || root.disabled) return;

        if (
            root.dataset.searchableMultiBound ===
            "true"
        ) {
            return;
        }

        root.dataset.searchableMultiBound = "true";

        const search = document.getElementById(
            `${id}Search`
        );
        const select = document.getElementById(
            `${id}Options`
        );
        const add = document.getElementById(
            `${id}Add`
        );
        const cancel = document.getElementById(
            `${id}Cancel`
        );
        const selected = document.getElementById(
            `${id}Selected`
        );
        const manager = root.querySelector(
            ".searchableMultiSelectManager"
        );

        if (
            !search ||
            !select ||
            !add ||
            !cancel ||
            !selected
        ) {
            return;
        }

        const refresh = () => {

            const query = this.normalize(search.value);
            let visible = 0;

            Array.from(select.options)
                .forEach(option => {

                    const matches = this
                        .normalize(option.textContent)
                        .includes(query);

                    const excluded =
                        option.dataset.excluded ===
                        "true";

                    option.hidden =
                        excluded || !matches;

                    if (!option.hidden) visible += 1;

                });

            select.selectedIndex = -1;

            const noMatches = document
                .getElementById(
                    `${id}NoMatches`
                );

            if (noMatches) {
                noMatches.hidden = visible > 0;
            }

        };

        search.addEventListener("input", refresh);

        const closeManager = () => {

            search.value = "";
            refresh();

            if (manager) {
                manager.open = false;
                manager.querySelector("summary")
                    ?.focus();
            }

        };

        manager?.addEventListener(
            "keydown",
            event => {
                if (
                    event.key !== "Escape" ||
                    !manager.open
                ) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                closeManager();
            }
        );

        add.addEventListener("click", () => {

            const option =
                select.selectedOptions[0];

            if (!option || option.hidden) return;

            option.dataset.excluded = "true";

            selected.querySelector(
                ".searchableMultiSelectEmpty"
            )?.remove();

            selected.append(
                this.createChipElement({
                    id,
                    value: option.value,
                    label: option.textContent.trim(),
                    color: option.dataset.color,
                    valueClass:
                        root.dataset.valueClass
                })
            );

            this.updateCount(id, selected);
            closeManager();

        });

        cancel.addEventListener(
            "click",
            closeManager
        );

        selected.addEventListener(
            "click",
            event => {

                const button = event.target.closest(
                    ".searchableMultiSelectRemove"
                );

                if (!button) return;

                const chip = button.closest(
                    ".searchableMultiSelectChip"
                );
                const value = chip?.dataset.value;

                if (!chip || value === undefined) {
                    return;
                }

                chip.remove();

                const option = Array
                    .from(select.options)
                    .find(item =>
                        item.value === value
                    );

                if (option) {
                    option.dataset.excluded = "false";
                }

                if (
                    !selected.querySelector(
                        ".searchableMultiSelectChip"
                    )
                ) {
                    const empty =
                        document.createElement("span");

                    empty.className =
                        "searchableMultiSelectEmpty";
                    empty.textContent =
                        "Ninguna seleccionada.";

                    selected.append(empty);
                }

                refresh();
                this.updateCount(id, selected);

            }
        );

        refresh();

    }

    createChipElement({
        id,
        value,
        label,
        color,
        valueClass
    }) {

        const chip = document.createElement("span");
        chip.className =
            "searchableMultiSelectChip";
        chip.dataset.value = value;

        const text = document.createElement("span");
        text.textContent = label;

        if (color) {
            const marker =
                document.createElement("span");

            marker.className =
                "searchableMultiSelectColor";
            marker.style.backgroundColor = color;
            chip.append(marker);
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className =
            "searchableMultiSelectRemove";
        remove.setAttribute(
            "aria-label",
            `Quitar ${label}`
        );
        remove.innerHTML = Icon.render(
            "close",
            "chipRemoveIcon"
        );

        const input = document.createElement("input");
        input.type = "hidden";
        input.className = valueClass;
        input.value = value;

        chip.append(text, remove, input);

        return chip;

    }

    updateCount(id, selected) {

        const count = document.getElementById(
            `${id}Count`
        );

        if (count) {
            count.textContent = String(
                selected.querySelectorAll(
                    ".searchableMultiSelectChip"
                ).length
            );
        }

    }

    normalize(value) {

        return String(value ?? "")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .trim();

    }

}
