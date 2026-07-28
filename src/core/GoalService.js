import { GoalRepository } from "../infrastructure/GoalRepository.js";

export class GoalService {

    constructor() {

        this.repository = new GoalRepository();

    }

    getAllGoals() {

        return this.repository.getAll();

    }

    getGoalById(id) {

        return this.repository.getById(id);

    }

    createGoal(data) {

        return this.repository.add(data);

    }

    updateGoal(id, data) {

        const goal = this.repository.getById(id);

        if (!goal) {
            throw new Error("Objetivo inexistente.");
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

        this.repository.remove(id);

    }

    getRequiredGoal(id) {

        const goal = this.repository.getById(id);

        if (!goal) {
            throw new Error("Objetivo inexistente.");
        }

        return goal;

    }

}
