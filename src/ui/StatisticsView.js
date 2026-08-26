import { buildAreaStatistics } from "../core/Statistics.js";
import { escapeHtml } from "./escapeHtml.js";

function formatProgress(metric) {
    if (metric.percentage === null) {
        return "Sin desglose";
    }

    return `${metric.completed} de ${metric.total} — ${metric.percentage} %`;
}

function formatLastAdvance(value) {
    if (!value) return "Sin avances registrados";

    return new Intl.DateTimeFormat(
        "es-AR",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(new Date(value));
}

function renderProgress(metric) {
    const value = metric.percentage ?? 0;

    return `
        <div
            class="statisticsProgress"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${value}"
            aria-label="${escapeHtml(formatProgress(metric))}">
            <span style="width: ${value}%"></span>
        </div>
    `;
}

function renderMetricDetails(metric, periodLabel) {
    return `
        <dl class="statisticsDetails">
            <div>
                <dt>Tareas consideradas</dt>
                <dd>${metric.total}</dd>
            </div>
            <div>
                <dt>Completadas</dt>
                <dd>${metric.completed}</dd>
            </div>
            <div>
                <dt>Pendientes</dt>
                <dd>${metric.pending}</dd>
            </div>
            <div>
                <dt>Vencidas</dt>
                <dd>${metric.overdue}</dd>
            </div>
            <div>
                <dt>Pospuestas</dt>
                <dd>${metric.postponed}</dd>
            </div>
            <div>
                <dt>Completadas ${escapeHtml(periodLabel)}</dt>
                <dd>${metric.recentCompleted}</dd>
            </div>
        </dl>
        <p class="statisticsLastAdvance">
            Último avance:
            <strong>
                ${escapeHtml(
                    formatLastAdvance(metric.lastAdvance)
                )}
            </strong>
        </p>
    `;
}

export class StatisticsView {

    getPeriodLabel(period) {
        const labels = {
            "180": "en 6 meses",
            "365": "en 12 meses",
            ALL: "en todo el historial"
        };

        return labels[period] ?? `en ${period} días`;
    }

    renderArea(area, periodLabel) {
        const progress = area.percentage === null
            ? "Sin datos"
            : `${area.percentage} %`;
        const colorStyle = area.color
            ? ` style="color: ${escapeHtml(area.color)}"`
            : "";

        return `
            <article class="statisticsAreaRow">
                <div class="statisticsAreaHeading">
                    <strong${colorStyle}>
                        ${escapeHtml(area.name)}
                    </strong>
                    <span>${escapeHtml(progress)}</span>
                </div>
                ${renderProgress(area)}
                <p class="statisticsAreaSummary">
                    ${area.completed} completada${area.completed === 1 ? "" : "s"} ${escapeHtml(periodLabel)}
                    · ${area.pending} pendiente${area.pending === 1 ? "" : "s"}
                </p>
            </article>
        `;
    }

    renderProject(project, periodLabel) {
        return `
            <article class="statisticsCard">
                <header>
                    <div>
                        <p class="statisticsEyebrow">Proyecto</p>
                        <h3>${escapeHtml(project.title)}</h3>
                    </div>
                    <button
                        type="button"
                        class="tertiaryAction openStatisticsProject"
                        data-id="${escapeHtml(project.id)}">
                        Abrir
                    </button>
                </header>
                <div class="statisticsProgressLine">
                    <p class="statisticsProgressLabel">
                        ${escapeHtml(formatProgress(project))}
                    </p>
                    ${renderProgress(project)}
                </div>
                ${renderMetricDetails(
                    project,
                    periodLabel
                )}
            </article>
        `;
    }

    renderGoal(
        goal,
        periodLabel,
        parentGoalTitle = null
    ) {
        const metric = goal.accumulated;
        const deadline = goal.daysAvailable === null
            ? ""
            : goal.daysAvailable >= 0
                ? `${goal.daysAvailable} días disponibles`
                : `${Math.abs(goal.daysAvailable)} días de atraso`;

        return `
            <article class="statisticsCard statisticsGoalCard">
                <header>
                    <div>
                        <p class="statisticsEyebrow">Objetivo</p>
                        <h3>${escapeHtml(goal.title)}</h3>
                        ${parentGoalTitle
                            ? `
                                <p class="statisticsGoalParent">
                                    Objetivo padre:
                                    <strong>${escapeHtml(parentGoalTitle)}</strong>
                                </p>
                            `
                            : ""}
                    </div>
                    <button
                        type="button"
                        class="tertiaryAction openStatisticsGoal"
                        data-id="${escapeHtml(goal.id)}">
                        Abrir
                    </button>
                </header>
                <div class="statisticsProgressLine">
                    <p class="statisticsProgressLabel">
                        ${escapeHtml(formatProgress(metric))}
                    </p>
                    ${renderProgress(metric)}
                </div>
                <p class="statisticsOwnProgress">
                    Avance propio:
                    <strong>
                        ${escapeHtml(
                            formatProgress(goal.own)
                        )}
                    </strong>
                    ${goal.subgoalCount > 0
                        ? ` · ${goal.subgoalCount} subobjetivo${goal.subgoalCount === 1 ? "" : "s"}`
                        : ""}
                </p>
                ${renderMetricDetails(
                    metric,
                    periodLabel
                )}
                ${deadline
                    ? `
                        <p class="statisticsDeadline">
                            ${escapeHtml(deadline)}
                        </p>
                    `
                    : ""}
            </article>
        `;
    }

    render(state) {
        const statistics = state.statistics ?? {
            period: "30",
            panorama: {
                total: 0,
                completed: 0,
                pending: 0,
                percentage: null,
                overdue: 0,
                postponed: 0,
                recentCompleted: 0,
                projects: 0,
                goals: 0
            },
            projects: [],
            goals: []
        };
        const periodLabel = this.getPeriodLabel(
            statistics.period
        );
        const areaStatistics = buildAreaStatistics({
            tasks: state.allTasks ?? [],
            areas: state.areas ?? [],
            period: statistics.period,
            today: state.today
        });
        const goalsById = new Map(
            (state.goals ?? []).map(goal => [
                goal.id,
                goal
            ])
        );

        return `
            <main class="content statisticsView">
                <header class="statisticsHeading">
                    <div>
                        <p class="statisticsEyebrow">
                            Planificación
                        </p>
                        <h1>Estadísticas</h1>
                        <p>
                            Avance de proyectos y objetivos,
                            sin puntajes de productividad.
                        </p>
                    </div>

                    <label class="statisticsPeriod">
                        <span>Período</span>
                        <select id="statisticsPeriod">
                            <option value="7" ${statistics.period === "7" ? "selected" : ""}>7 días</option>
                            <option value="30" ${statistics.period === "30" ? "selected" : ""}>30 días</option>
                            <option value="90" ${statistics.period === "90" ? "selected" : ""}>90 días</option>
                            <option value="180" ${statistics.period === "180" ? "selected" : ""}>6 meses</option>
                            <option value="365" ${statistics.period === "365" ? "selected" : ""}>12 meses</option>
                            <option value="ALL" ${statistics.period === "ALL" ? "selected" : ""}>Todo el historial</option>
                        </select>
                    </label>
                </header>

                <section class="statisticsPanorama">
                    <h2>Panorama general</h2>
                    <div class="statisticsIndicators">
                        <article>
                            <strong>${statistics.panorama.projects}</strong>
                            <span>Proyectos</span>
                        </article>
                        <article>
                            <strong>${statistics.panorama.goals}</strong>
                            <span>Objetivos</span>
                        </article>
                        <article>
                            <strong>${statistics.panorama.pending}</strong>
                            <span>Tareas pendientes</span>
                        </article>
                        <article>
                            <strong>${statistics.panorama.recentCompleted}</strong>
                            <span>Completadas ${escapeHtml(periodLabel)}</span>
                        </article>
                    </div>
                </section>

                <section class="statisticsBreakdown">
                    <input
                        class="statisticsTabInput"
                        type="radio"
                        name="statisticsSection"
                        id="statisticsTabAreas"
                        checked>
                    <input
                        class="statisticsTabInput"
                        type="radio"
                        name="statisticsSection"
                        id="statisticsTabProjects">
                    <input
                        class="statisticsTabInput"
                        type="radio"
                        name="statisticsSection"
                        id="statisticsTabGoals">

                    <nav
                        class="statisticsTabs"
                        aria-label="Desglose de estadísticas">
                        <label for="statisticsTabAreas">
                            Áreas
                            <span>${areaStatistics.length}</span>
                        </label>
                        <label for="statisticsTabProjects">
                            Proyectos
                            <span>${statistics.projects.length}</span>
                        </label>
                        <label for="statisticsTabGoals">
                            Objetivos
                            <span>${statistics.goals.length}</span>
                        </label>
                    </nav>

                    <section
                        class="statisticsSection statisticsPanel statisticsPanelAreas"
                        aria-labelledby="statisticsTabAreas">
                        <div class="statisticsAreaList">
                            ${areaStatistics.length > 0
                                ? areaStatistics
                                    .map(area =>
                                        this.renderArea(
                                            area,
                                            periodLabel
                                        )
                                    )
                                    .join("")
                                : `
                                    <p class="emptyState">
                                        No hay áreas para medir.
                                    </p>
                                `}
                        </div>
                    </section>

                    <section
                        class="statisticsSection statisticsPanel statisticsPanelProjects"
                        aria-labelledby="statisticsTabProjects">
                        <div class="statisticsGrid">
                            ${statistics.projects.length > 0
                                ? statistics.projects
                                    .map(project =>
                                        this.renderProject(
                                            project,
                                            periodLabel
                                        )
                                    )
                                    .join("")
                                : `
                                    <p class="emptyState">
                                        No hay proyectos con subtareas activas.
                                    </p>
                                `}
                        </div>
                    </section>

                    <section
                        class="statisticsSection statisticsPanel statisticsPanelGoals"
                        aria-labelledby="statisticsTabGoals">
                        <div class="statisticsGrid">
                            ${statistics.goals.length > 0
                                ? statistics.goals
                                    .map(goal => {
                                        const sourceGoal =
                                            goalsById.get(goal.id);
                                        const parentGoal = sourceGoal
                                            ?.parentGoalId
                                                ? goalsById.get(
                                                    sourceGoal.parentGoalId
                                                )
                                                : null;

                                        return this.renderGoal(
                                            goal,
                                            periodLabel,
                                            parentGoal?.title ?? null
                                        );
                                    })
                                    .join("")
                                : `
                                    <p class="emptyState">
                                        No hay objetivos para medir.
                                    </p>
                                `}
                        </div>
                    </section>
                </section>
            </main>
        `;
    }
}
