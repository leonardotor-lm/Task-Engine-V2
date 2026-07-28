import { escapeHtml } from "./escapeHtml.js";

export class SearchableSelect {

    render({
        id,
        label,
        options = [],
        placeholder = "Buscar…",
        selectClass = ""
    }) {

        if (options.length === 0) return "";

        const size = Math.min(
            6,
            Math.max(2, options.length)
        );

        return `
            <div
                class="searchableSelect"
                data-searchable-select-id="${escapeHtml(id)}">
                <label for="${escapeHtml(id)}Search">
                    ${escapeHtml(label)}
                </label>
                <input
                    id="${escapeHtml(id)}Search"
                    class="searchableSelectSearch"
                    type="search"
                    placeholder="${escapeHtml(placeholder)}"
                    autocomplete="off"
                    aria-controls="${escapeHtml(id)}">
                <select
                    id="${escapeHtml(id)}"
                    class="${escapeHtml(selectClass)}"
                    size="${size}"
                    required>
                    ${options.map(option => `
                        <option
                            value="${escapeHtml(option.value)}">
                            ${escapeHtml(option.label)}
                        </option>
                    `).join("")}
                </select>
                <p
                    class="searchableSelectEmpty"
                    hidden>
                    No hay coincidencias.
                </p>
            </div>
        `;

    }

    bind(id) {

        const search = document.getElementById(
            `${id}Search`
        );
        const select = document.getElementById(id);

        if (!search || !select) return;

        const empty = search
            .closest(".searchableSelect")
            ?.querySelector(
                ".searchableSelectEmpty"
            );

        const root = search.closest(
            ".searchableSelect"
        );

        if (root?.dataset.searchableBound === "true") {
            return;
        }

        if (root) {
            root.dataset.searchableBound = "true";
        }

        search.addEventListener("input", () => {

            const query = this.normalize(search.value);
            let visible = 0;

            Array.from(select.options)
                .forEach(option => {

                    const matches = this
                        .normalize(option.textContent)
                        .includes(query);

                    option.hidden = !matches;

                    if (matches) visible += 1;

                });

            if (
                select.selectedOptions[0]?.hidden
            ) {
                select.value = "";
            }

            if (empty) {
                empty.hidden = visible > 0;
            }

        });

        select.selectedIndex = -1;

    }

    bindAll(root = document) {

        root.querySelectorAll(
            "[data-searchable-select-id]"
        ).forEach(element => {
            this.bind(
                element.dataset.searchableSelectId
            );
        });

    }

    normalize(value) {

        return String(value ?? "")
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .trim();

    }

}
