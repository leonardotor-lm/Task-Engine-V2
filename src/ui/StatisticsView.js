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
        return period === "ALL"
            ? "en todo el historial"
            : `en ${period} días`;
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
                <p class="statisticsProgressLabel">
                    ${escapeHtml(formatProgress(project))}
                </p>
                ${renderProgress(project)}
                ${renderMetricDetails(
                    project,
                    periodLabel
                )}
            </article>
        `;
    }

    renderGoal(goal, periodLabel) {
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
                    </div>
                    <button
                        type="button"
                        class="tertiaryAction openStatisticsGoal"
                        data-id="${escapeHtml(goal.id)}">
                        Abrir
                    </button>
                </header>
                <p class="statisticsProgressLabel">
                    ${escapeHtml(formatProgress(metric))}
                </p>
                ${renderProgress(metric)}
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

                <section class="statisticsSection">
                    <div class="statisticsSectionHeading">
                        <h2>Proyectos</h2>
                        <span>${statistics.projects.length}</span>
                    </div>
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

                <section class="statisticsSection">
                    <div class="statisticsSectionHeading">
                        <h2>Objetivos</h2>
                        <span>${statistics.goals.length}</span>
                    </div>
                    <div class="statisticsGrid">
                        ${statistics.goals.length > 0
                            ? statistics.goals
                                .map(goal =>
                                    this.renderGoal(
                                        goal,
                                        periodLabel
                                    )
                                )
                                .join("")
                            : `
                                <p class="emptyState">
                                    No hay objetivos para medir.
                                </p>
                            `}
                    </div>
                </section>
            </main>
        `;
    }
}
