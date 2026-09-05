const MOBILE_MEDIA_QUERY = "(max-width: 760px)";
const COMPACT_STYLESHEET =
    "styles/task-editor-mobile-compact.css";
const SUPPORT_STYLE_ID =
    "mobile-task-editor-overflow-fix";

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
    subtasks: `
        <path d="M6 5h12"></path>
        <path d="M6 12h8"></path>
        <path d="M6 19h5"></path>
        <path d="M18 15v8"></path>
        <path d="M14 19h8"></path>
    `,
    goals: `
        <circle cx="12" cy="12" r="9"></circle>
        <circle cx="12" cy="12" r="5"></circle>
        <circle cx="12" cy="12" r="1"></circle>
    `,
    more: `
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 8v8"></path>
        <path d="M8 12h8"></path>
    `
});

let activeCleanup = null;

function ensureStyles() {
    if (!document.querySelector(
        `link[href="${COMPACT_STYLESHEET}"]`
    )) {
        const stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.href = COMPACT_STYLESHEET;
        document.head.append(stylesheet);
    }

    if (document.getElementById(SUPPORT_STYLE_ID)) {
        return;
    }

    const style = document.createElement("style");
    style.id = SUPPORT_STYLE_ID;
    style.textContent = `
        @media (max-width: 760px) {
            .mobileTaskEditorCompactOverflowActions #toggleTask,
            .mobileTaskEditorCompactOverflowActions #reopenTask,
            .mobileTaskEditorCompactOverflowActions #archiveTask,
            .mobileTaskEditorCompactOverflowActions #deleteTask,
            .mobileTaskEditorCompactOverflowActions #skipRecurringTask {
                display: block !important;
                box-sizing: border-box !important;
                width: 100% !important;
                min-height: 44px !important;
                margin: 0 !important;
                padding: 9px 10px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface) !important;
                color: var(--color-text-subtle) !important;
                font: inherit !important;
                font-size: 14px !important;
                font-weight: 400 !important;
                line-height: 1.3 !important;
                text-align: left !important;
            }

            .mobileTaskEditorCompactOverflowActions #deleteTask {
                color: var(--color-danger) !important;
            }

            .mobileTaskEditorCompactLayout .mobileTaskEditorFooter {
                position: static !important;
                inset: auto !important;
                z-index: auto !important;
            }

            .mobileTaskEditorCompactOverflowNotes {
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                background: transparent !important;
            }

            .mobileTaskEditorCompactOverflowNotes > summary {
                box-sizing: border-box !important;
                width: 100% !important;
                min-height: 44px !important;
                margin: 0 !important;
                padding: 9px 10px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface) !important;
                color: var(--color-text-subtle) !important;
                font-size: 14px !important;
                font-weight: 400 !important;
                list-style: none !important;
                cursor: pointer !important;
            }

            .mobileTaskEditorCompactOverflowNotes > summary::-webkit-details-marker {
                display: none !important;
            }

            .mobileTaskEditorCompactOverflowNotes > .editorSectionBody {
                display: grid !important;
                gap: 8px !important;
                margin: 6px 0 0 !important;
                padding: 8px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface-subtle) !important;
            }

            .mobileTaskEditorCompactOverflowNotes .fieldHelp,
            .mobileTaskEditorCompactOverflowNotes .syncErrorHint {
                margin: 0 !important;
                font-size: 12px !important;
                line-height: 1.35 !important;
            }

            .mobileTaskEditorCompactOverflowNotes .taskEditorActions {
                display: grid !important;
                gap: 6px !important;
                margin: 0 !important;
            }

            .mobileTaskEditorCompactOverflowNotes a,
            .mobileTaskEditorCompactOverflowNotes button {
                display: flex !important;
                align-items: center !important;
                box-sizing: border-box !important;
                width: 100% !important;
                min-height: 44px !important;
                margin: 0 !important;
                padding: 9px 10px !important;
                border: 1px solid var(--color-border) !important;
                border-radius: 6px !important;
                background: var(--color-surface) !important;
                color: var(--color-text-subtle) !important;
                font: inherit !important;
                font-size: 14px !important;
                font-weight: 400 !important;
                text-align: left !important;
                text-decoration: none !important;
            }
        }
    `;
    document.head.append(style);
}

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

export function renderCompactMobileTaskEditorIcon(name) {
    return renderIcon(name);
}

function formatDueSummary(dateValue, timeValue) {
    if (!dateValue) return "Sin fecha";

    const [year, month, day] = dateValue
        .split("-")
        .map(Number);
    const date = new Date(year, month - 1, day);

    if (Number.isNaN(date.getTime())) return dateValue;

    const formatted = new Intl.DateTimeFormat(
        "es-AR",
        { day: "numeric", month: "short" }
    ).format(date).replace(".", "");

    return timeValue
        ? `${formatted} · ${timeValue}`
        : formatted;
}

function createSummary({ label, icon, value = "" }) {
    const summary = document.createElement("summary");
    summary.className = "mobileTaskEditorCompactSummary";
    summary.innerHTML = `
        ${renderIcon(icon)}
        <span class="mobileTaskEditorCompactLabel">${label}</span>
        <span class="mobileTaskEditorCompactValue"></span>
    `;
    summary.querySelector(
        ".mobileTaskEditorCompactValue"
    ).textContent = value;
    return summary;
}

function addPanelHeader(details, body, title) {
    if (!body || body.querySelector(
        ":scope > .mobileTaskEditorCompactPanelHeader"
    )) {
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

function addDateClearAction(
    field,
    inputId,
    accessibleLabel
) {
    const input = field?.querySelector(`#${inputId}`);
    if (!input) return;

    field.classList.add(
        "mobileTaskEditorDateProperty"
    );

    const button = document.createElement("button");
    button.type = "button";
    button.className = "mobileTaskEditorDateClear";
    button.textContent = "Quitar";
    button.setAttribute("aria-label", accessibleLabel);

    const sync = () => {
        button.hidden = !input.value || input.disabled;
    };

    button.addEventListener("click", () => {
        input.value = "";
        input.dispatchEvent(new Event(
            "input",
            { bubbles: true }
        ));
        input.dispatchEvent(new Event(
            "change",
            { bubbles: true }
        ));
        sync();
        input.focus();
    });

    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    field.append(button);
    sync();
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
            .filter(child => child.classList.contains(
                "mobileTaskEditorPickerCount"
            ));

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
        configureTransient(
            details,
            details.querySelector(bodySelector),
            label
        );
    }

    tool.classList.add("mobileTaskEditorCompactTool");
    return tool;
}

function createOrganizationHeading(contextBar) {
    if (!contextBar || contextBar.previousElementSibling
        ?.classList.contains(
            "mobileTaskEditorOrganizationHeading"
        )) {
        return;
    }

    const heading = document.createElement("div");
    heading.className = "mobileTaskEditorOrganizationHeading";
    heading.textContent = "Organización";
    contextBar.before(heading);

    const contextLabel = contextBar.querySelector(
        'label[for="taskContext"]'
    );
    if (contextLabel) contextLabel.textContent = "@Contexto";
}

function appendNotionNotes(drawer, body) {
    const notionSection = drawer.querySelector(
        ".editorNotionSection"
    );
    if (!notionSection) return;

    notionSection.classList.add(
        "mobileTaskEditorCompactOverflowNotes"
    );

    const title = document.createElement("strong");
    title.className = "mobileTaskEditorCompactOverflowTitle";
    title.textContent = "Notas";

    const notes = document.createElement("div");
    notes.className =
        "mobileTaskEditorCompactOverflowNotesContainer";
    notes.append(notionSection);
    body.append(title, notes);
}

function createOverflow(drawer, grid) {
    if (!grid) return null;

    const details = document.createElement("details");
    details.className =
        "mobileTaskEditorCompactTool " +
        "mobileTaskEditorCompactOverflow";

    const summary = document.createElement("summary");
    summary.className =
        "mobileTaskEditorCompactSummary " +
        "mobileTaskEditorCompactOverflowSummary";
    summary.setAttribute("aria-label", "Más opciones");
    summary.setAttribute("title", "Más opciones");
    summary.innerHTML = `
        ${renderIcon("more")}
        <span class="mobileTaskEditorCompactLabel">
            Más
        </span>
    `;

    const body = document.createElement("div");
    body.className = "mobileTaskEditorCompactOverflowPanel";

    const optionFields = document.createElement("div");
    optionFields.className =
        "mobileTaskEditorCompactOverflowOptions";
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
    ].filter(Boolean)
        .forEach(field => optionFields.append(field));

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

    appendNotionNotes(drawer, body);

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

    if (body.childElementCount === 0) return null;

    details.append(summary, body);
    grid.append(details);
    configureTransient(details, body, "Opciones");
    return details;
}

function buildFooter(drawer) {
    const footer = drawer.querySelector(
        ".mobileTaskEditorFooter"
    );
    const save = footer?.querySelector("#saveTask");
    if (!footer || !save) return;

    save.textContent = "Guardar";

    if (footer.querySelector(
        ".mobileTaskEditorCompactCancel"
    )) {
        return;
    }

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "mobileTaskEditorCompactCancel";
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", () => {
        document.getElementById("closeTaskEditor")?.click();
    });

    footer.querySelector(
        ".mobileTaskEditorPrimaryActions"
    )?.prepend(cancel);
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
            if (
                panel !== current &&
                !panel.contains(current)
            ) {
                panel.open = false;
            }
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

export function enhanceCompactMobileTaskEditor(drawer) {
    if (
        !window.matchMedia(MOBILE_MEDIA_QUERY).matches ||
        !drawer ||
        drawer.dataset.mobileTaskEditorCompact === "true"
    ) {
        return;
    }

    ensureStyles();
    drawer.dataset.mobileTaskEditorCompact = "true";
    drawer.classList.add("mobileTaskEditorCompactLayout");

    drawer.querySelector(
        'label[for="taskDescriptionEdit"]'
    )?.classList.remove("mobileTaskEditorVisuallyHidden");

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

        addDateClearAction(
            startField,
            "taskStartDate",
            "Quitar fecha de inicio"
        );
        addDateClearAction(
            dueField,
            "taskDueDate",
            "Quitar fecha y hora de vencimiento"
        );

        const priority = createFieldTool({
            fields: [priorityField],
            label: "Prioridad",
            icon: "priority",
            valueReader: () =>
                document.getElementById("taskPriority")
                    ?.selectedOptions?.[0]
                    ?.textContent?.trim() ?? ""
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
                detailsSelector: ".searchableMultiSelectManager",
                bodySelector: ".searchableMultiSelectManagerBody"
            }
        );
        const programming = decorateExistingTool(
            grid.querySelector(
                ".mobileTaskEditorRecurrenceTool"
            ),
            {
                label: "Programación",
                icon: "programming",
                bodySelector: ":scope > .editorSectionBody"
            }
        );
        const goals = decorateExistingTool(
            grid.querySelector('[data-picker-id="taskGoals"]'),
            {
                label: "Objetivo",
                icon: "goals",
                detailsSelector: ".searchableMultiSelectManager",
                bodySelector: ".searchableMultiSelectManagerBody"
            }
        );
        const attachments = drawer.querySelector(
            ".mobileTaskEditorAttachments"
        );
        const subtasks = drawer.querySelector(
            ".mobileTaskEditorSubtasks"
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
            configureTransient(
                attachments,
                attachments.querySelector(
                    ":scope > .editorSectionBody"
                ),
                "Adjuntos"
            );
        }

        if (subtasks) {
            subtasks.classList.add(
                "mobileTaskEditorCompactTool",
                "mobileTaskEditorCompactSubtasks"
            );
            subtasks.open = false;
            const summary = subtasks.querySelector(
                ":scope > summary"
            );
            if (summary) {
                const count = subtasks.querySelectorAll(
                    ".editorSubtaskList > li"
                ).length;
                summary.classList.add(
                    "mobileTaskEditorCompactSummary"
                );
                summary.innerHTML = `
                    ${renderIcon("subtasks")}
                    <span class="mobileTaskEditorCompactLabel">
                        Subtareas
                    </span>
                    ${count > 0
                        ? `<span class="mobileTaskEditorCompactValue">${count}</span>`
                        : ""}
                `;
            }
            configureTransient(
                subtasks,
                subtasks.querySelector(
                    ":scope > .editorSectionBody"
                ),
                "Subtareas"
            );
        }

        [
            priority,
            due,
            tags,
            programming,
            attachments,
            goals,
            subtasks
        ].filter(Boolean)
            .forEach(tool => grid.append(tool));
    }

    createOverflow(drawer, grid);

    if (properties?.childElementCount === 0) {
        properties.remove();
    }

    buildFooter(drawer);
    bindPanels(drawer);
}
