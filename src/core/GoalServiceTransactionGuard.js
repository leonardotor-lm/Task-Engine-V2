import { Goal } from "../domain/Goal.js";

const GUARDED_METHODS = Object.freeze([
    "createGoal",
    "updateGoal",
    "completeGoal",
    "reopenGoal",
    "archiveGoal",
    "restoreGoal",
    "deleteGoal",
    "restoreDeletedGoal",
    "permanentlyDeleteGoal",
    "moveGoal",
    "detachGoal"
]);

function cloneGoals(goals = []) {
    return goals.map(goal =>
        new Goal(goal.toJSON())
    );
}

function restoreSafely(repository, snapshot) {
    try {
        repository?.replaceAll?.(snapshot);
    } catch {
        // Conservamos el error original de la operación.
    }
}

export function installGoalServiceTransactionGuard(
    goalService,
    methodNames = GUARDED_METHODS
) {
    if (
        !goalService ||
        goalService.__transactionGuardInstalled
    ) {
        return goalService;
    }

    const repository = goalService.repository;

    if (
        !repository?.getAll ||
        !repository?.replaceAll
    ) {
        return goalService;
    }

    for (const methodName of methodNames) {
        const original = goalService[methodName];
        if (typeof original !== "function") continue;

        goalService[methodName] = (...args) => {
            const snapshot = cloneGoals(
                repository.getAll()
            );

            try {
                return original.apply(goalService, args);
            } catch (error) {
                restoreSafely(repository, snapshot);
                throw error;
            }
        };
    }

    goalService.__transactionGuardInstalled = true;
    return goalService;
}
