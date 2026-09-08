export class QuickActionsPortalController {

    constructor({
        documentRef = globalThis.document,
        windowRef = globalThis.window
    } = {}) {

        this.document = documentRef;
        this.window = windowRef;
        this.entries = [];

    }

    isMobile() {

        return this.window?.matchMedia?.(
            "(max-width: 760px)"
        ).matches ?? false;

    }

    bind() {

        this.cleanup();

        if (!this.document || !this.isMobile()) {
            return;
        }

        this.document.querySelectorAll(
            ".quickMoreActions"
        ).forEach(details => {

            const menu = details.querySelector(
                ".quickMoreMenu"
            );

            if (!menu) return;

            const entry = {
                details,
                menu,
                parent: menu.parentNode,
                nextSibling: menu.nextSibling,
                onToggle: null
            };

            entry.onToggle = () => {

                if (details.open) {
                    this.portal(entry);
                } else {
                    this.restore(entry);
                }

            };

            details.addEventListener(
                "toggle",
                entry.onToggle
            );

            this.entries.push(entry);

            if (details.open) {
                this.portal(entry);
            }

        });

    }

    portal(entry) {

        const { details, menu } = entry;

        menu.dataset.quickActionsOwnerId =
            details.dataset.id;
        menu.classList.add(
            "quickMoreMenuPortaled"
        );
        this.document.body.append(menu);

    }

    restore(entry) {

        const {
            menu,
            parent,
            nextSibling
        } = entry;

        menu.classList.remove(
            "quickMoreMenuPortaled"
        );
        delete menu.dataset.quickActionsOwnerId;

        if (parent?.isConnected === false) {
            menu.remove();
            return;
        }

        if (nextSibling?.parentNode === parent) {
            parent.insertBefore(menu, nextSibling);
        } else {
            parent?.append(menu);
        }

    }

    getOwner(control) {

        const directOwner = control?.closest?.(
            ".quickMoreActions"
        );

        if (directOwner) return directOwner;

        const ownerId = control?.closest?.(
            ".quickMoreMenu"
        )?.dataset.quickActionsOwnerId;

        if (!ownerId) return null;

        return this.entries.find(entry => (
            entry.details.dataset.id === ownerId
        ))?.details ?? null;

    }

    cleanup() {

        for (const entry of this.entries) {

            entry.details.removeEventListener(
                "toggle",
                entry.onToggle
            );
            this.restore(entry);

        }

        this.entries = [];

    }

}
