import { Task } from "../domain/Task.js";
import { Area } from "../domain/Area.js";
import { Context } from "../domain/Context.js";
import { Tag } from "../domain/Tag.js";
import { CustomFilter } from "../domain/CustomFilter.js";
import { Goal } from "../domain/Goal.js";

const CORE_SERIALIZERS = {
    tasks: item => new Task(item).toJSON(),
    areas: item => new Area(item).toJSON(),
    contexts: item => new Context(item).toJSON(),
    tags: item => new Tag(item).toJSON()
};

const OPTIONAL_SERIALIZERS = {
    customFilters:
        item => new CustomFilter(item).toJSON(),
    goals: item => new Goal(item).toJSON()
};

function hasOwn(object, property) {

    return Object.prototype.hasOwnProperty.call(
        object ?? {},
        property
    );

}

function canonicalizeCollection(
    value,
    serializer
) {

    if (!Array.isArray(value)) {
        return [];
    }

    return value.map(item => {

        try {
            return serializer(item);
        } catch {
            return item;
        }

    });

}

export function canonicalizeSyncBackup(backup) {

    if (backup === null) {
        return null;
    }

    const sourceData = backup?.data;

    if (!sourceData) {
        return backup;
    }

    const data = {};

    for (
        const [collection, serializer] of
        Object.entries(CORE_SERIALIZERS)
    ) {
        data[collection] =
            canonicalizeCollection(
                sourceData[collection],
                serializer
            );
    }

    for (
        const [collection, serializer] of
        Object.entries(OPTIONAL_SERIALIZERS)
    ) {

        if (hasOwn(sourceData, collection)) {
            data[collection] =
                canonicalizeCollection(
                    sourceData[collection],
                    serializer
                );
        }

    }

    if (
        hasOwn(
            sourceData,
            "taskSortPreferences"
        )
    ) {
        data.taskSortPreferences =
            sourceData.taskSortPreferences;
    }

    return {
        format: backup.format,
        version: backup.version,
        data
    };

}
