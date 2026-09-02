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

    "chevron-up": `
        <path d="m18 15-6-6-6 6"></path>
    `,

    "chevron-right": `
        <path d="m9 18 6-6-6-6"></path>
    `,

    "chevron-left": `
        <path d="m15 18-6-6 6-6"></path>
    `,

    "corner-down-right": `
        <polyline points="15 10 20 15 15 20"></polyline>
        <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
    `,

    clock: `
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6h4"></path>
    `,

    hand: `
        <path d="M18 11V6a2 2 0 0 0-4 0v5"></path>
        <path d="M14 10V4a2 2 0 1 0-4 0v6"></path>
        <path d="M10 10.5V6a2 2 0 1 0-4 0v8"></path>
        <path d="M6 14v-2a2 2 0 1 0-4 0v2"></path>
        <path d="M18 8a2 2 0 1 1 4 0v6a10 10 0 0 1-10 10h-2a10 10 0 0 1-7.1-2.9L3 19"></path>
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

    "list-checks": `
        <path d="m3 17 2 2 4-4"></path>
        <path d="m3 7 2 2 4-4"></path>
        <path d="M13 6h8"></path>
        <path d="M13 12h8"></path>
        <path d="M13 18h8"></path>
    `,

    search: `
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
    `,

    settings: `
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    `,

    note: `
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M8 13h8"></path>
        <path d="M8 17h5"></path>
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
