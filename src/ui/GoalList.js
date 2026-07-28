import { GoalStatus } from "../domain/GoalStatus.js";
import { escapeHtml } from "./escapeHtml.js";

export class GoalList {

    render(goals = []) {

        const activeGoals = goals.filter(
            goal =>
                goal.status ===
                GoalStatus.ACTIVE
        );

        return `
            <main class="content goalsView">

                <div class="contentHeader">
                    <h2>Objetivos</h2>
                </div>

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

                </form>

                ${activeGoals.length > 0
                    ? this.renderTree(activeGoals)
                    : `
                        <p class="emptyState">
                            No hay objetivos activos.
                        </p>
                    `}

            </main>
        `;

    }

    renderTree(goals) {

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
                            <button
                                type="button"
                                class="openGoal"
                                data-id="${escapeHtml(goal.id)}">
                                ${escapeHtml(goal.title)}
                            </button>

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

    formatDate(value) {

        const [
            year,
            month,
            day
        ] = value.split("-");

        return `${day}/${month}/${year}`;

    }

}
