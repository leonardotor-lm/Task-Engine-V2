import { Task } from "../domain/Task.js";
import { Area } from "../domain/Area.js";
import { Context } from "../domain/Context.js";
import { Tag } from "../domain/Tag.js";
import { CustomFilter } from "../domain/CustomFilter.js";
import { Goal } from "../domain/Goal.js";

const LEGACY_TIMESTAMP =
    "1970-01-01T00:00:00.000Z";

function prepareEntity(
    item,
    {
        recurrenceId = false
    } = {}
) {

    if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item) ||
        !item.id
    ) {
        return item;
    }

    const createdAt =
        item.createdAt ?? LEGACY_TIMESTAMP;

    const prepared = {
        ...item,
        createdAt,
        updatedAt:
            item.updatedAt ?? createdAt
    };

    if (
        recurrenceId &&
        item.recurrence !== null &&
        item.recurrence !== undefined &&
        item.recurrenceId == null
    ) {
        prepared.recurrenceId =
            `legacy-recurrence:${item.id}`;
    }

    return prepared;

}

const CORE_SERIALIZERS = {
    tasks: item =>
        new Task(
            prepareEntity(item, {
                recurrenceId: true
            })
        ).toJSON(),
    areas: item =>
        new Area(
            prepareEntity(item)
        ).toJSON(),
    contexts: item =>
        new Context(
            prepareEntity(item)
        ).toJSON(),
    tags: item =>
        new Tag(
            prepareEntity(item)
        ).toJSON()
};

const OPTIONAL_SERIALIZERS = {
    customFilters: item =>
        new CustomFilter(
            prepareEntity(item)
        ).toJSON(),
    goals: item =>
        new Goal(
            prepareEntity(item)
        ).toJSON()
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
