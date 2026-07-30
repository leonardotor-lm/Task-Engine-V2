import { escapeHtml } from "./escapeHtml.js";

const icons = Object.freeze({

    back: `
        <path d="m12 19-7-7 7-7"></path>
        <path d="M19 12H5"></path>
    `,

    plus: `
        <path d="M5 12h14"></path>
        <path d="M12 5v14"></path>
    `,

    save: `
        <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
        <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
        <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
    `,

    edit: `
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
        <path d="m15 5 4 4"></path>
    `,

    eye: `
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path>
        <circle cx="12" cy="12" r="3"></circle>
    `,

    "eye-off": `
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path>
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path>
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path>
        <path d="m2 2 20 20"></path>
    `,

    more: `
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
    `,

    close: `
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
    `,

    "chevron-down": `
        <path d="m6 9 6 6 6-6"></path>
    `,

    "chevron-right": `
        <path d="m9 18 6-6-6-6"></path>
    `,

    clock: `
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6h4"></path>
    `,

    repeat: `
        <path d="m2 9 3-3 3 3"></path>
        <path d="M13 18H7a2 2 0 0 1-2-2V6"></path>
        <path d="m22 15-3 3-3-3"></path>
        <path d="M11 6h6a2 2 0 0 1 2 2v10"></path>
    `,

    menu: `
        <path d="M4 5h16"></path>
        <path d="M4 12h16"></path>
        <path d="M4 19h16"></path>
    `,

    check: `
        <path d="M20 6 9 17l-5-5"></path>
    `,

    search: `
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
    `

});

export class Icon {

    static render(name, className = "") {

        if (!Object.hasOwn(icons, name)) {
            throw new Error(
                `Ícono desconocido: ${name}`
            );
        }

        const additionalClasses = className
            .trim()
            .split(/\s+/)
            .filter(
                value =>
                    /^[a-zA-Z][a-zA-Z0-9_-]*$/
                        .test(value)
            );

        const classes = [
            "icon",
            ...additionalClasses
        ].join(" ");

        return `
            <svg
                class="${escapeHtml(classes)}"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
                focusable="false">
                ${icons[name]}
            </svg>
        `;

    }

    static get names() {
        return Object.keys(icons);
    }

}
