const STORAGE_KEY = "task-engine-v2-pinned-projects";

export class ProjectPinPreferences {

    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    normalizeProjectIds(projectIds) {

        if (!Array.isArray(projectIds)) {
            throw new Error(
                "La lista de proyectos anclados es inválida."
            );
        }

        return [
            ...new Set(
                projectIds
                    .map(value => String(value ?? "").trim())
                    .filter(Boolean)
            )
        ];

    }

    getPinnedProjectIds() {

        if (!this.storage) return [];

        try {
            const parsed = JSON.parse(
                this.storage.getItem(STORAGE_KEY) ?? "[]"
            );

            return this.normalizeProjectIds(parsed);
        } catch {
            return [];
        }

    }

    isPinned(projectId) {
        return this.getPinnedProjectIds()
            .includes(String(projectId ?? ""));
    }

    replaceAll(
        projectIds,
        { throwOnError = false } = {}
    ) {

        const normalized =
            this.normalizeProjectIds(projectIds);

        if (!this.storage) {
            return normalized;
        }

        try {
            this.storage.setItem(
                STORAGE_KEY,
                JSON.stringify(normalized)
            );
        } catch (error) {
            if (throwOnError) {
                throw error;
            }
        }

        return normalized;

    }

    setPinned(projectId, pinned) {

        const normalizedId =
            String(projectId ?? "").trim();

        if (!normalizedId) {
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

        this.replaceAll([...ids]);

        return ids.has(normalizedId);

    }

    toggle(projectId) {
        return this.setPinned(
            projectId,
            !this.isPinned(projectId)
        );
    }

    prune(validProjectIds) {

        const validIds = new Set(
            this.normalizeProjectIds([
                ...validProjectIds
            ])
        );

        const nextIds = this.getPinnedProjectIds()
            .filter(id => validIds.has(id));

        this.replaceAll(nextIds);

        return nextIds;

    }

}
