import { Goal } from "../domain/Goal.js";
import { Task } from "../domain/Task.js";

function cloneTasks(tasks = []) {
    return tasks.map(task =>
        new Task(task.toJSON())
    );
}

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

export function permanentlyDeleteGoalWithTaskCleanup(
    goalService,
    taskService,
    goalId
) {
    const removedGoalIds =
        goalService.getPermanentDeletionGoalIds(
            goalId
        );
    const taskRepository = taskService.repository;
    const goalRepository = goalService.repository;
    const taskSnapshot = cloneTasks(
        taskRepository.getAll()
    );
    const goalSnapshot = cloneGoals(
        goalRepository.getAll()
    );

    try {
        taskService.removeGoalAssociations(
            removedGoalIds
        );

        return goalService.permanentlyDeleteGoal(
            goalId
        );
    } catch (error) {
        restoreSafely(goalRepository, goalSnapshot);
        restoreSafely(taskRepository, taskSnapshot);
        throw error;
    }
}
