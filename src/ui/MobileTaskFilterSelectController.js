export class MobileTaskFilterSelectController {

    constructor(
        app,
        {
            documentRef = globalThis.document,
            windowRef = globalThis.window
        } = {}
    ) {

        this.app = app;
        this.document = documentRef;
        this.window = windowRef;

    }

    start() {

        const mainView = this.app.mainView;
        const originalRender =
            mainView.render.bind(mainView);

        mainView.render = state => {

            originalRender(state);
            this.enhanceMobileSelects();

        };

    }

    isMobileViewport() {

        return Boolean(
            this.window?.matchMedia?.(
                "(max-width: 760px)"
            )?.matches
        );

    }

    enhanceMobileSelects() {

        if (!this.isMobileViewport()) return;

        this.document?.querySelectorAll?.(
            "#taskFilterForm select, " +
            "#activitySearchForm select, " +
            "#taskArea, #taskContext"
        ).forEach(select => {
            this.enhanceSelect(select);
        });

    }

    enhanceSelect(select) {

        if (
            !select?.id ||
            select.dataset.mobileFilterEnhanced === "true"
        ) {
            return;
        }

        const nativeLabel = this.document.querySelector(
            `label[for="${select.id}"]`
        );
        const label = nativeLabel?.textContent?.trim() ||
            select.getAttribute("aria-label") ||
            "Elegir opción";

        const picker = this.document.createElement(
            "details"
        );
        picker.className = "mobileFilterSelect";
        picker.dataset.for = select.id;

        const summary = this.document.createElement(
            "summary"
        );
        summary.className = "mobileFilterSelectSummary";
        summary.setAttribute(
            "aria-label",
            `${label}: ${this.getSelectedLabel(select)}`
        );

        const value = this.document.createElement("span");
        value.className = "mobileFilterSelectValue";
        value.textContent = this.getSelectedLabel(select);

        const chevron = this.document.createElement("span");
        chevron.className = "mobileFilterSelectChevron";
        chevron.setAttribute("aria-hidden", "true");
        chevron.textContent = "⌄";

        summary.append(value, chevron);
        picker.append(summary);

        const menu = this.document.createElement("div");
        menu.className = "mobileFilterSelectMenu";
        menu.setAttribute("role", "listbox");
        menu.setAttribute("aria-label", label);

        Array.from(select.options).forEach(option => {

            const button = this.document.createElement(
                "button"
            );
            button.type = "button";
            button.className = "mobileFilterSelectOption";
            button.dataset.value = option.value;
            button.textContent = option.textContent.trim();
            button.setAttribute(
                "role",
                "option"
            );

            const selected =
                option.value === select.value;
            button.setAttribute(
                "aria-selected",
                String(selected)
            );

            button.addEventListener("click", () => {

                select.value = option.value;
                value.textContent = option.textContent.trim();
                summary.setAttribute(
                    "aria-label",
                    `${label}: ${option.textContent.trim()}`
                );

                menu.querySelectorAll(
                    ".mobileFilterSelectOption"
                ).forEach(item => {
                    item.setAttribute(
                        "aria-selected",
                        String(
                            item.dataset.value === option.value
                        )
                    );
                });

                select.dispatchEvent(
                    new Event("change", { bubbles: true })
                );
                picker.open = false;

            });

            menu.append(button);

        });

        picker.append(menu);
        select.dataset.mobileFilterEnhanced = "true";
        select.classList.add("mobileFilterNativeSelect");
        select.insertAdjacentElement("afterend", picker);

    }

    getSelectedLabel(select) {

        return select.selectedOptions?.[0]
            ?.textContent?.trim() ||
            select.options?.[0]
            ?.textContent?.trim() ||
            "Elegir";

    }

}
