const MOBILE_MEDIA_QUERY = "(max-width: 760px)";

const ICONS = Object.freeze({
    priority: `
        <path d="M5 21V4"></path>
        <path d="M5 4h10l-1.6 3L15 10H5"></path>
    `,
    due: `
        <rect x="3" y="5" width="18" height="16" rx="2"></rect>
        <path d="M16 3v4"></path>
        <path d="M8 3v4"></path>
        <path d="M3 11h18"></path>
    `,
    tags: `
        <path d="M20.6 13.6 11 4H4v7l9.6 9.6a2 2 0 0 0 2.8 0l4.2-4.2a2 2 0 0 0 0-2.8Z"></path>
        <circle cx="7.5" cy="7.5" r="1"></circle>
    `,
    programming: `
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 7v5l3 2"></path>
    `,
    attachments: `
        <path d="m20.5 11.5-8.9 8.9a5 5 0 0 1-7.1-7.1l9.6-9.6a3.5 3.5 0 0 1 5 5l-9.7 9.7a2 2 0 0 1-2.8-2.8l8.9-8.9"></path>
    `,
    goals: `
        <circle cx="12" cy="12" r="9"></circle>
        <circle cx="12" cy="12" r="5"></circle>
        <circle cx="12" cy="12" r="1"></circle>
    `,
    more: `
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
    `
});

let activeCleanup = null;

function renderIcon(name) {
    const paths = ICONS[name] ?? ICONS.more;

    return `
        <svg
            class="mobileTaskEditorCompactIcon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            aria-hidden="true"
            focusable="false">
            ${paths}
        </svg>
    `;
}

function formatDueSummary(dateValue, timeValue) {
    if (!dateValue) return "Sin fecha";

    const [year, month, day] = dateValue
        .split("-")
        .map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    const formatted = new Intl.DateTimeFormat(
        "es-AR",
        {
            day: "numeric",
            month: "short"
        }
    ).format(date).replace(".", "");

    return timeValue
        ? `${formatted} · ${timeValue}`
        : formatted;
}

function createSummary({
    label,
    icon,
    value = ""
}) {
    const summary = document.createElement("summary");
    summary.className = "mobileTaskEditorCompactSummary";
    summary.innerHTML = `
        ${renderIcon(icon)}
        <span class="mobileTaskEditorCompactLabel">
            ${label}
        </span>
        <span class="mobileTaskEditorCompactValue"></span>
    `;
    summary.querySelector(
        ".mobileTaskEditorCompactValue"
    ).textContent = value;

    return summary;
}

function addPanelHeader(details, body, title) {
    if (
        body.querySelector(
            ":scope > .mobileTaskEditorCompactPanelHeader"
        )
    ) {
        return;
    }

    const header = document.createElement("div");
    header.className = "mobileTaskEditorCompactPanelHeader";

    const heading = document.createElement("strong");
    heading.textContent = title;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "mobileTaskEditorCompactPanelClose";
    close.setAttribute(
        "aria-label",
        `Cerrar ${title.toLowerCase()}`
    );
    close.textContent = "×";
    close.addEventListener("click", () => {
        details.open = false;
        details.querySelector(":scope > summary")?.focus();
    });

    header.append(heading, close);
    body.prepend(header);
}

function configureTransient(details, body, title) {
    if (!details || !body) return;

    details.classList.add(
        "mobileTaskEditorCompactTransient"
    );
    body.classList.add(
        "mobileTaskEditorCompactPanel"
    );
    addPanelHeader(details, body, title);

    const sync = () => {
        body.hidden = !details.open;
    };

    details.addEventListener("toggle", sync);
    sync();
}

function createFieldTool({
    fields,
    label,
    icon,
    valueReader
}) {
    const usableFields = fields.filter(Boolean);
    if (usableFields.length === 0) return null;

    const details = document.createElement("details");
    details.className = "mobileTaskEditorCompactTool";

    const summary = createSummary({
        label,
        icon,
        value: valueReader?.() ?? ""
    });
    const body = document.createElement("div");
    body.className = "mobileTaskEditorCompactToolBody";

    usableFields.forEach(field => body.append(field));
    details.append(summary, body);

    const refresh = () => {
        summary.querySelector(
            ".mobileTaskEditorCompactValue"
        ).textContent = valueReader?.() ?? "";
    };

    usableFields.forEach(field => {
        field.querySelectorAll("input, select")
            .forEach(control => {
                control.addEventListener("change", refresh);
                control.addEventListener("input", refresh);
            });
    });

    configureTransient(details, body, label);
    return details;
}

function decorateExistingTool(
    tool,
    {
        label,
        icon,
        detailsSelector = null,
        bodySelector = null
    }
) {
    if (!tool) return null;

    const details = detailsSelector
        ? tool.querySelector(detailsSelector)
        : tool.matches("details")
            ? tool
            : null;

    if (!details) return tool;

    const summary = details.querySelector(":scope > summary");
    if (summary) {
        const trailing = Array.from(summary.children)
            .filter(child =>
                child.classList.contains(
                    "mobileTaskEditorPickerCount"
                )
            );

        summary.classList.add("mobileTaskEditorCompactSummary");
        summary.replaceChildren();
        summary.insertAdjacentHTML(
            "beforeend",
            renderIcon(icon)
        );

        const labelElement = document.createElement("span");
        labelElement.className = "mobileTaskEditorCompactLabel";
        labelElement.textContent = label;
        summary.append(labelElement, ...trailing);
    }

    if (bodySelector) {
        const body = details.querySelector(bodySelector);
        configureTransient(details, body, label);
    }

    tool.classList.add("mobileTaskEditorCompactTool");
    return tool;
}

function createOrganizationHeading(contextBar) {
    if (!contextBar || contextBar.previousElementSibling
        ?.classList.contains("mobileTaskEditorOrganizationHeading")) {
        return;
    }

    const heading = document.createElement("div");
    heading.className = "mobileTaskEditorOrganizationHeading";
    heading.textContent = "Organización";
    contextBar.before(heading);

    const contextLabel = contextBar.querySelector(
        'label[for="taskContext"]'
    );
    if (contextLabel) {
        contextLabel.textContent = "@Contexto";
    }
}

function createOverflow(drawer, grid) {
    const header = drawer.querySelector(".taskEditorHeader");
    if (!header) return null;

    const details = document.createElement("details");
    details.className = "mobileTaskEditorCompactOverflow";

    const summary = document.createElement("summary");
    summary.className = "mobileTaskEditorCompactOverflowSummary";
    summary.setAttribute("aria-label", "Más acciones");
    summary.setAttribute("title", "Más acciones");
    summary.innerHTML = renderIcon("more");

    const body = document.createElement("div");
    body.className = "mobileTaskEditorCompactOverflowPanel";

    const optionFields = document.createElement("div");
    optionFields.className = "mobileTaskEditorCompactOverflowOptions";

    const properties = drawer.querySelector(
        ".mobileTaskEditorProperties"
    );
    [
        properties?.querySelector(
            ".mobileTaskEditorWaitingProperty"
        ),
        properties?.querySelector(
            ".mobileTaskEditorProjectProperty"
        )
    ].filter(Boolean).forEach(field => optionFields.append(field));

    const move = grid?.querySelector(
        ".mobileTaskEditorMoveTool"
    );
    if (move) optionFields.append(move);

    if (optionFields.childElementCount > 0) {
        const title = document.createElement("strong");
        title.className = "mobileTaskEditorCompactOverflowTitle";
        title.textContent = "Opciones";
        body.append(title, optionFields);
    }

    const administrative = drawer.querySelector(
        ".mobileTaskEditorAdministrativeActions"
    );
    const primary = drawer.querySelector(
        ".mobileTaskEditorPrimaryActions"
    );
    const secondaryButtons = [
        primary?.querySelector("#toggleTask"),
        primary?.querySelector("#reopenTask")
    ].filter(Boolean);

    if (
        administrative?.childElementCount > 0 ||
        secondaryButtons.length > 0
    ) {
        const title = document.createElement("strong");
        title.className = "mobileTaskEditorCompactOverflowTitle";
        title.textContent = "Acciones";
        body.append(title);

        const actions = document.createElement("div");
        actions.className = "mobileTaskEditorCompactOverflowActions";
        secondaryButtons.forEach(button => actions.append(button));

        if (administrative) {
            while (administrative.firstChild) {
                actions.append(administrative.firstChild);
            }
            administrative.remove();
        }

        body.append(actions);
    }

    if (body.childElementCount === 0) {
        return null;
    }

    details.append(summary, body);
    header.append(details);
    configureTransient(details, body, "Más acciones");
    return details;
}

function buildFooter(drawer) {
    const footer = drawer.querySelector(
        ".mobileTaskEditorFooter"
    );
    const save = footer?.querySelector("#saveTask");

    if (!footer || !save) return;

    save.textContent = "Guardar";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mobileTaskEditorCompactCancel";
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", () => {
        document.getElementById("closeTaskEditor")?.click();
    });

    const primary = footer.querySelector(
        ".mobileTaskEditorPrimaryActions"
    );
    primary?.prepend(cancel);
}

function bindPanels(drawer) {
    activeCleanup?.();

    const panels = () => Array.from(
        drawer.querySelectorAll(
            ".mobileTaskEditorTransient, " +
            ".mobileTaskEditorCompactTransient"
        )
    );

    const toggleHandlers = [];
    const closeOthers = current => {
        panels().forEach(panel => {
            if (panel !== current) panel.open = false;
        });
    };

    panels().forEach(panel => {
        const handler = () => {
            if (panel.open) closeOthers(panel);
        };
        panel.addEventListener("toggle", handler);
        toggleHandlers.push([panel, handler]);
    });

    const keydown = event => {
        if (event.key !== "Escape") return;
        const open = panels().find(panel => panel.open);
        if (!open) return;

        event.preventDefault();
        open.open = false;
        open.querySelector(":scope > summary")?.focus();
    };

    const pointerdown = event => {
        const open = panels().find(panel => panel.open);
        if (!open || open.contains(event.target)) return;
        open.open = false;
    };

    document.addEventListener("keydown", keydown, true);
    document.addEventListener("pointerdown", pointerdown, true);

    activeCleanup = () => {
        toggleHandlers.forEach(([panel, handler]) => {
            panel.removeEventListener("toggle", handler);
        });
        document.removeEventListener("keydown", keydown, true);
        document.removeEventListener("pointerdown", pointerdown, true);
    };
}

function enhanceEditor() {
    if (!window.matchMedia(MOBILE_MEDIA_QUERY).matches) {
        return;
    }

    const drawer = document.querySelector(
        ".mobileTaskEditorLayout:not(.recoveryPanel)"
    );

    if (
        !drawer ||
        drawer.dataset.mobileTaskEditorCompact === "true"
    ) {
        return;
    }

    drawer.dataset.mobileTaskEditorCompact = "true";
    drawer.classList.add("mobileTaskEditorCompactLayout");

    const descriptionLabel = drawer.querySelector(
        'label[for="taskDescriptionEdit"]'
    );
    descriptionLabel?.classList.remove(
        "mobileTaskEditorVisuallyHidden"
    );

    const contextBar = drawer.querySelector(
        ".mobileTaskEditorContextBar"
    );
    createOrganizationHeading(contextBar);

    const properties = drawer.querySelector(
        ".mobileTaskEditorProperties"
    );
    const grid = drawer.querySelector(
        ".mobileTaskEditorToolGrid"
    );

    if (grid && properties) {
        const priorityField = properties.querySelector(
            "#taskPriority"
        )?.closest(".mobileTaskEditorProperty");
        const startField = properties.querySelector(
            "#taskStartDate"
        )?.closest(".mobileTaskEditorProperty");
        const dueField = properties.querySelector(
            "#taskDueDate"
        )?.closest(".mobileTaskEditorProperty");
        const timeField = properties.querySelector(
            "#taskDueTime"
        )?.closest(".mobileTaskEditorProperty");

        const priority = createFieldTool({
            fields: [priorityField],
            label: "Prioridad",
            icon: "priority",
            valueReader: () =>
                document.getElementById("taskPriority")
                    ?.selectedOptions?.[0]?.textContent?.trim() ?? ""
        });

        const due = createFieldTool({
            fields: [startField, dueField, timeField],
            label: "Vencimiento",
            icon: "due",
            valueReader: () => formatDueSummary(
                document.getElementById("taskDueDate")?.value,
                document.getElementById("taskDueTime")?.value
            )
        });

        const tags = decorateExistingTool(
            grid.querySelector('[data-picker-id="taskTags"]'),
            {
                label: "Etiquetas",
                icon: "tags",
                detailsSelector: ".searchableMultiSelectManager"
            }
        );
        const programming = decorateExistingTool(
            grid.querySelector(".mobileTaskEditorRecurrenceTool"),
            {
                label: "Programación",
                icon: "programming"
            }
        );
        const goals = decorateExistingTool(
            grid.querySelector('[data-picker-id="taskGoals"]'),
            {
                label: "Objetivo",
                icon: "goals",
                detailsSelector: ".searchableMultiSelectManager"
            }
        );
        const attachments = drawer.querySelector(
            ".mobileTaskEditorAttachments"
        );

        if (attachments) {
            attachments.classList.add(
                "mobileTaskEditorCompactTool",
                "mobileTaskEditorCompactAttachments"
            );
            const summary = attachments.querySelector(
                ":scope > summary"
            );
            if (summary) {
                summary.classList.add(
                    "mobileTaskEditorCompactSummary"
                );
                summary.innerHTML = `
                    ${renderIcon("attachments")}
                    <span class="mobileTaskEditorCompactLabel">
                        Adjuntos
                    </span>
                `;
            }
            const body = attachments.querySelector(
                ":scope > .editorSectionBody"
            );
            configureTransient(
                attachments,
                body,
                "Adjuntos"
            );
        }

        const ordered = [
            priority,
            due,
            tags,
            programming,
            attachments,
            goals
        ].filter(Boolean);

        ordered.forEach(tool => grid.append(tool));
    }

    createOverflow(drawer, grid);

    if (properties && properties.childElementCount === 0) {
        properties.remove();
    }

    buildFooter(drawer);
    bindPanels(drawer);
}

function scheduleEnhancement() {
    queueMicrotask(enhanceEditor);
}

const observer = new MutationObserver(scheduleEnhancement);
observer.observe(document.body, {
    childList: true,
    subtree: true
});

window.addEventListener("resize", scheduleEnhancement);
scheduleEnhancement();
