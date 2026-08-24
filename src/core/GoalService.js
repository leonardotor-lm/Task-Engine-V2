import { GoalRepository } from "../infrastructure/GoalRepository.js";
import { GoalStatus } from "../domain/GoalStatus.js";

export class GoalService {

    constructor(
        repository = new GoalRepository()
    ) {

        this.repository = repository;

    }

    getAllGoals() {

        return this.repository.getAll();

    }

    getGoalById(id) {

        return this.repository.getById(id);

    }

    createGoal(data) {

        if (data.parentGoalId) {
            this.getRequiredGoal(data.parentGoalId);
        }

        return this.repository.add(data);

    }

    updateGoal(id, data) {

        const goal = this.repository.getById(id);

        if (!goal) {
            throw new Error("Objetivo inexistente.");
        }

        if (data.parentGoalId !== undefined) {
            this.validateParentGoal(
                id,
                data.parentGoalId
            );
        }

        goal.update(data);

        this.repository.update(goal);

        return goal;

    }

    completeGoal(id) {

        const goal = this.getRequiredGoal(id);

        goal.complete();

        this.repository.update(goal);

        return goal;

    }

    reopenGoal(id) {

        const goal = this.getRequiredGoal(id);

        goal.reopen();

        this.repository.update(goal);

        return goal;

    }

    archiveGoal(id) {

        const goal = this.getRequiredGoal(id);

        goal.archive();

        this.repository.update(goal);

        return goal;

    }

    restoreGoal(id) {

        const goal = this.getRequiredGoal(id);

        goal.restoreFromArchive();

        this.repository.update(goal);

        return goal;

    }

    deleteGoal(id) {

        const goal = this.getRequiredGoal(id);

        const tree = [
            goal,
            ...this.getDescendants(id)
        ];

        for (const item of tree) {
            item.delete();
            this.repository.update(item);
        }

        return goal;

    }

    restoreDeletedGoal(id) {

        const goal = this.getRequiredGoal(id);

        const tree = [
            goal,
            ...this.getDescendants(id)
        ];

        for (const item of tree) {

            if (
                item.status ===
                GoalStatus.DELETED
            ) {
                item.restoreFromTrash();
                this.repository.update(item);
            }

        }

        return goal;

    }

    permanentlyDeleteGoal(id) {

        const goalIds =
            this.getPermanentDeletionGoalIds(id);
        const goalsById = new Map(
            this.repository
                .getAll()
                .map(goal => [goal.id, goal])
        );

        for (const goalId of [...goalIds].reverse()) {
            if (goalsById.has(goalId)) {
                this.repository.remove(goalId);
            }
        }

        return goalsById.get(id);

    }

    getPermanentDeletionGoalIds(id) {

        const goal = this.getRequiredGoal(id);

        if (
            goal.status !==
            GoalStatus.DELETED
        ) {
            throw new Error(
                "Sólo se puede eliminar definitivamente un objetivo de la papelera."
            );
        }

        const tree = [
            goal,
            ...this.getDescendants(id)
        ];

        return tree.map(item => item.id);

    }

    getActiveGoals() {
        return this.getGoalsByStatus(
            GoalStatus.ACTIVE
        );
    }

    getCompletedGoals() {
        return this.getGoalsByStatus(
            GoalStatus.COMPLETED
        );
    }

    getArchivedGoals() {
        return this.getGoalsByStatus(
            GoalStatus.ARCHIVED
        );
    }

    getDeletedGoals() {
        return this.getGoalsByStatus(
            GoalStatus.DELETED
        );
    }

    getGoalsByStatus(status) {

        return this.repository
            .getAll()
            .filter(goal => goal.status === status);

    }

    getDirectSubgoals(parentGoalId) {

        return this.repository
            .getAll()
            .filter(
                goal =>
                    goal.parentGoalId ===
                    parentGoalId
            );

    }

    getDescendants(parentGoalId) {

        this.getRequiredGoal(parentGoalId);

        const descendants = [];
        const visited = new Set([parentGoalId]);
        const pendingIds = [parentGoalId];
        const goals = this.repository.getAll();

        while (pendingIds.length > 0) {

            const currentId = pendingIds.shift();

            for (const goal of goals) {

                if (
                    goal.parentGoalId === currentId &&
                    !visited.has(goal.id)
                ) {
                    visited.add(goal.id);
                    descendants.push(goal);
                    pendingIds.push(goal.id);
                }

            }

        }

        return descendants;

    }

    moveGoal(id, parentGoalId) {

        const goal = this.getRequiredGoal(id);

        this.validateParentGoal(
            id,
            parentGoalId
        );

        goal.update({ parentGoalId });

        this.repository.update(goal);

        return goal;

    }

    detachGoal(id) {

        const goal = this.getRequiredGoal(id);

        if (goal.parentGoalId === null) {
            throw new Error(
                "El objetivo ya es un objetivo principal."
            );
        }

        goal.update({
            parentGoalId: null
        });

        this.repository.update(goal);

        return goal;

    }

    validateParentGoal(id, parentGoalId) {

        if (parentGoalId === null) return;

        if (id === parentGoalId) {
            throw new Error(
                "Un objetivo no puede ser su propio objetivo principal."
            );
        }

        this.getRequiredGoal(parentGoalId);

        if (
            this.getDescendants(id)
                .some(
                    goal =>
                        goal.id === parentGoalId
                )
        ) {
            throw new Error(
                "No se puede mover un objetivo dentro de uno de sus descendientes."
            );
        }

    }

    getRequiredGoal(id) {

        const goal = this.repository.getById(id);

        if (!goal) {
            throw new Error("Objetivo inexistente.");
        }

        return goal;

    }

}
