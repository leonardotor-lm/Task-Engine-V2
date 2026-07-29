import { GoalStatus } from "../domain/GoalStatus.js";
import { escapeHtml } from "./escapeHtml.js";

export class GoalList {

    render(
        goals = [],
        currentStatus = GoalStatus.ACTIVE,
        creationOpen = false
    ) {

        const visibleGoals = goals.filter(
            goal =>
                goal.status === currentStatus
        );

        return `
            <main class="content goalsView">

                <div class="contentHeader">
                    <h2>Objetivos</h2>

                    ${currentStatus === GoalStatus.ACTIVE &&
                        !creationOpen
                        ? `
                            <button
                                id="openGoalCreation"
                                type="button">
                                Crear objetivo
                            </button>
                        `
                        : ""}
                </div>

                ${this.renderStatusNavigation(
                    currentStatus
                )}

                ${currentStatus === GoalStatus.ACTIVE &&
                    creationOpen
                    ? `
                <form id="goalForm" class="goalForm">
                    <label for="goalTitle">
                        Nuevo objetivo
                    </label>

                    <input
                        id="goalTitle"
                        type="text"
                        placeholder="Título"
                        maxlength="160"
                        required>

                    <textarea
                        id="goalDescription"
                        rows="3"
                        placeholder="Descripción optativa"></textarea>

                    <label for="goalDueDate">
                        Fecha límite optativa
                    </label>

                    <input
                        id="goalDueDate"
                        type="date">

                    <button type="submit">
                        Crear objetivo
                    </button>

                    <button
                        id="cancelGoalCreation"
                        type="button"
                        class="secondaryAction">
                        Cancelar
                    </button>

                </form>
                    `
                    : ""}

                ${visibleGoals.length > 0
                    ? this.renderTree(
                        visibleGoals,
                        currentStatus
                    )
                    : `
                        <p class="emptyState">
                            ${currentStatus ===
                                GoalStatus.ACTIVE
                                ? "Aún no fijaste ningún objetivo."
                                : "No hay objetivos en esta sección."}
                        </p>
                    `}

            </main>
        `;

    }

    renderStatusNavigation(currentStatus) {

        const sections = [
            [GoalStatus.ACTIVE, "Activos"],
            [GoalStatus.COMPLETED, "Completados"],
            [GoalStatus.ARCHIVED, "Archivados"],
            [GoalStatus.DELETED, "Papelera"]
        ];

        return `
            <nav class="goalStatusNavigation">
                ${sections.map(([status, label]) => `
                    <button
                        type="button"
                        class="showGoalStatus ${status ===
                            currentStatus
                            ? "active"
                            : ""}"
                        data-status="${status}">
                        ${label}
                    </button>
                `).join("")}
            </nav>
        `;

    }

    renderTree(goals, currentStatus) {

        const goalsByParent = new Map();
        const goalIds = new Set(
            goals.map(goal => goal.id)
        );

        for (const goal of goals) {

            const parentId =
                goal.parentGoalId &&
                goalIds.has(goal.parentGoalId)
                    ? goal.parentGoalId
                    : null;

            const siblings =
                goalsByParent.get(parentId) ?? [];

            siblings.push(goal);
            goalsByParent.set(parentId, siblings);

        }

        const visited = new Set();

        const renderBranch = parentId => (
            goalsByParent
                .get(parentId)
                ?.map(goal => {

                    if (visited.has(goal.id)) {
                        return "";
                    }

                    visited.add(goal.id);

                    const children =
                        renderBranch(goal.id);

                    return `
                        <li class="goalItem">
                            ${currentStatus ===
                                GoalStatus.ACTIVE
                                ? `
                                    <button
                                        type="button"
                                        class="openGoal"
                                        data-id="${escapeHtml(goal.id)}">
                                        ${escapeHtml(goal.title)}
                                    </button>
                                `
                                : `
                                    <strong>
                                        ${escapeHtml(goal.title)}
                                    </strong>
                                `}

                            ${goal.dueDate
                                ? `
                                    <time
                                        datetime="${escapeHtml(goal.dueDate)}">
                                        ${escapeHtml(
                                            this.formatDate(
                                                goal.dueDate
                                            )
                                        )}
                                    </time>
                                `
                                : ""}

                            ${goal.description
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            goal.description
                                        )}
                                    </p>
                                `
                                : ""}

                            ${this.renderActions(
                                goal,
                                currentStatus
                            )}

                            ${children
                                ? `
                                    <ul class="goalChildren">
                                        ${children}
                                    </ul>
                                `
                                : ""}
                        </li>
                    `;

                })
                .join("") ?? ""
        );

        return `
            <ul class="goalList">
                ${renderBranch(null)}
            </ul>
        `;

    }

    renderActions(goal, status) {

        const id = escapeHtml(goal.id);

        if (status === GoalStatus.COMPLETED) {
            return `
                <div class="goalHistoryActions">
                    <button
                        class="reopenGoal"
                        data-id="${id}">
                        Reactivar
                    </button>
                    <button
                        class="deleteGoal"
                        data-id="${id}">
                        Papelera
                    </button>
                </div>
            `;
        }

        if (status === GoalStatus.ARCHIVED) {
            return `
                <div class="goalHistoryActions">
                    <button
                        class="restoreArchivedGoal"
                        data-id="${id}">
                        Restaurar
                    </button>
                    <button
                        class="deleteGoal"
                        data-id="${id}">
                        Papelera
                    </button>
                </div>
            `;
        }

        if (status === GoalStatus.DELETED) {
            return `
                <div class="goalHistoryActions">
                    <button
                        class="restoreDeletedGoal"
                        data-id="${id}">
                        Restaurar
                    </button>
                    <button
                        class="permanentlyDeleteGoal dangerAction"
                        data-id="${id}">
                        Eliminar definitivamente
                    </button>
                </div>
            `;
        }

        return "";

    }

    formatDate(value) {

        const [
            year,
            month,
            day
        ] = value.split("-");

        return `${day}/${month}/${year}`;

    }

}
