import test from "node:test";
import assert from "node:assert/strict";

import { StatisticsView } from "../src/ui/StatisticsView.js";

function metric(id, title) {
    return {
        id,
        title,
        daysAvailable: null,
        subgoalCount: 0,
        own: {
            total: 0,
            completed: 0,
            pending: 0,
            percentage: null,
            overdue: 0,
            postponed: 0,
            recentCompleted: 0,
            lastAdvance: null
        },
        accumulated: {
            total: 0,
            completed: 0,
            pending: 0,
            percentage: null,
            overdue: 0,
            postponed: 0,
            recentCompleted: 0,
            lastAdvance: null
        }
    };
}

test("Estadísticas indica el objetivo padre sólo en los subobjetivos", () => {
    const view = new StatisticsView();
    const html = view.render({
        today: "2026-08-25",
        areas: [],
        allTasks: [],
        goals: [
            {
                id: "parent",
                title: "Objetivo principal",
                parentGoalId: null
            },
            {
                id: "child",
                title: "Subobjetivo",
                parentGoalId: "parent"
            }
        ],
        statistics: {
            period: "30",
            panorama: {
                projects: 0,
                goals: 2,
                pending: 0,
                recentCompleted: 0
            },
            projects: [],
            goals: [
                metric("parent", "Objetivo principal"),
                metric("child", "Subobjetivo")
            ]
        }
    });

    assert.match(
        html,
        /Objetivo padre:\s*<strong>Objetivo principal<\/strong>/
    );
    assert.equal(
        (html.match(/Objetivo padre:/g) ?? []).length,
        1
    );
});

test("escapa el título del objetivo padre al mostrarlo", () => {
    const view = new StatisticsView();
    const html = view.render({
        today: "2026-08-25",
        areas: [],
        allTasks: [],
        goals: [
            {
                id: "parent",
                title: "Padre <script>",
                parentGoalId: null
            },
            {
                id: "child",
                title: "Subobjetivo",
                parentGoalId: "parent"
            }
        ],
        statistics: {
            period: "30",
            panorama: {
                projects: 0,
                goals: 1,
                pending: 0,
                recentCompleted: 0
            },
            projects: [],
            goals: [metric("child", "Subobjetivo")]
        }
    });

    assert.match(html, /Padre &lt;script&gt;/);
    assert.doesNotMatch(html, /<strong>Padre <script><\/strong>/);
});
