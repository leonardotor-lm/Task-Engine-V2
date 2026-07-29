import { escapeHtml } from "./escapeHtml.js";

const icons = Object.freeze({

    back: `
        <path d="M19 12H5"></path>
        <path d="m12 19-7-7 7-7"></path>
    `,

    plus: `
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
    `,

    save: `
        <path
            d="M5 4h11l3 3v13H5z">
        </path>
        <path d="M8 4v6h8V4"></path>
        <path d="M8 20v-6h8v6"></path>
    `,

    edit: `
        <path
            d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z">
        </path>
        <path d="m14.5 7.5 3 3"></path>
    `,

    eye: `
        <path
            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z">
        </path>
        <circle cx="12" cy="12" r="2.5"></circle>
    `,

    "eye-off": `
        <path
            d="M4.5 5.5C3.2 6.8 2.5 8.2 2.5 8.2S6 14.2 12 14.2c1.2 0 2.3-.2 3.3-.6">
        </path>
        <path
            d="M9.1 6.5c.9-.3 1.8-.5 2.9-.5 6 0 9.5 6 9.5 6s-.8 1.4-2.2 2.8">
        </path>
        <path d="m4 4 16 16"></path>
    `,

    more: `
        <circle cx="5" cy="12" r="1"></circle>
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
    `,

    close: `
        <path d="M6 6l12 12"></path>
        <path d="M18 6 6 18"></path>
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
