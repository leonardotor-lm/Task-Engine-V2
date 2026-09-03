const STORAGE_KEY = "task-engine-v2-pinned-projects";

export class ProjectPinPreferences {

    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    getPinnedProjectIds() {

        if (!this.storage) return [];

        try {
            const parsed = JSON.parse(
                this.storage.getItem(STORAGE_KEY) ?? "[]"
            );

            if (!Array.isArray(parsed)) return [];

            return [
                ...new Set(
                    parsed
                        .map(value => String(value ?? "").trim())
                        .filter(Boolean)
                )
            ];
        } catch {
            return [];
        }

    }

    isPinned(projectId) {
        return this.getPinnedProjectIds()
            .includes(String(projectId ?? ""));
    }

    setPinned(projectId, pinned) {

        const normalizedId =
            String(projectId ?? "").trim();

        if (!normalizedId || !this.storage) {
            return false;
        }

        const ids = new Set(
            this.getPinnedProjectIds()
        );

        if (pinned) {
            ids.add(normalizedId);
        } else {
            ids.delete(normalizedId);
        }

        this.storage.setItem(
            STORAGE_KEY,
            JSON.stringify([...ids])
        );

        return ids.has(normalizedId);

    }

    toggle(projectId) {
        return this.setPinned(
            projectId,
            !this.isPinned(projectId)
        );
    }

    prune(validProjectIds) {

        if (!this.storage) return [];

        const validIds = new Set(
            [...validProjectIds]
                .map(value => String(value ?? "").trim())
                .filter(Boolean)
        );

        const nextIds = this.getPinnedProjectIds()
            .filter(id => validIds.has(id));

        this.storage.setItem(
            STORAGE_KEY,
            JSON.stringify(nextIds)
        );

        return nextIds;

    }

}
