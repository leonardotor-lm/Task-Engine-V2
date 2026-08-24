import { Tag } from "../domain/Tag.js";
import { Task } from "../domain/Task.js";

function cloneTasks(tasks = []) {
    return tasks.map(task =>
        new Task(task.toJSON())
    );
}

function cloneTags(tags = []) {
    return tags.map(tag =>
        new Tag(tag.toJSON())
    );
}

function restoreSafely(repository, snapshot) {
    try {
        repository?.replaceAll?.(snapshot);
    } catch {
        // Conservamos el error original de la operación.
    }
}

export function deleteTagWithTaskCleanup(
    tagService,
    taskService,
    tagId,
    taskFilterPreferencesRepository = null
) {
    const taskRepository = taskService.repository;
    const tagRepository = tagService.repository;
    const taskSnapshot = cloneTasks(
        taskRepository.getAll()
    );
    const tagSnapshot = cloneTags(
        tagRepository.getAll()
    );
    const filterSnapshot =
        taskFilterPreferencesRepository
            ?.getAll?.() ?? null;

    try {
        tagService.deleteTag(tagId);

        taskFilterPreferencesRepository
            ?.clearTag?.(tagId);

        const updatedTasks =
            taskService.removeTagAssociations(
                tagId
            );

        return updatedTasks;
    } catch (error) {
        restoreSafely(tagRepository, tagSnapshot);
        restoreSafely(taskRepository, taskSnapshot);
        if (filterSnapshot !== null) {
            restoreSafely(
                taskFilterPreferencesRepository,
                filterSnapshot
            );
        }
        throw error;
    }
}
