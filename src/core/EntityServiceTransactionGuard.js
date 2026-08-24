import { Area } from "../domain/Area.js";
import { Context } from "../domain/Context.js";
import { CustomFilter } from "../domain/CustomFilter.js";
import { Tag } from "../domain/Tag.js";

function restoreSafely(repository, snapshot) {
    try {
        repository?.replaceAll?.(snapshot);
    } catch {
        // Conservamos el error original de la operación.
    }
}

function installGuard(
    service,
    Entity,
    methodNames,
    flagName
) {
    if (!service || service[flagName]) {
        return service;
    }

    const repository = service.repository;

    if (
        !repository?.getAll ||
        !repository?.replaceAll
    ) {
        return service;
    }

    for (const methodName of methodNames) {
        const original = service[methodName];
        if (typeof original !== "function") continue;

        service[methodName] = (...args) => {
            const snapshot = repository
                .getAll()
                .map(item =>
                    new Entity(item.toJSON())
                );

            try {
                return original.apply(service, args);
            } catch (error) {
                restoreSafely(repository, snapshot);
                throw error;
            }
        };
    }

    service[flagName] = true;
    return service;
}

export function installAreaServiceTransactionGuard(
    service
) {
    return installGuard(
        service,
        Area,
        [
            "createArea",
            "updateArea",
            "deleteArea",
            "moveArea"
        ],
        "__areaTransactionGuardInstalled"
    );
}

export function installContextServiceTransactionGuard(
    service
) {
    return installGuard(
        service,
        Context,
        [
            "createContext",
            "updateContext",
            "deleteContext"
        ],
        "__contextTransactionGuardInstalled"
    );
}

export function installTagServiceTransactionGuard(
    service
) {
    return installGuard(
        service,
        Tag,
        [
            "createTag",
            "updateTag",
            "deleteTag"
        ],
        "__tagTransactionGuardInstalled"
    );
}

export function installCustomFilterServiceTransactionGuard(
    service
) {
    return installGuard(
        service,
        CustomFilter,
        [
            "createFilter",
            "updateFilter",
            "deleteFilter"
        ],
        "__customFilterTransactionGuardInstalled"
    );
}
