import { test, expect } from "@playwright/test";

async function seedGoals(page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            "task-engine-v2-goals",
            JSON.stringify([
                {
                    id: "parent",
                    title: "Objetivo principal",
                    status: "ACTIVE",
                    parentGoalId: null
                },
                {
                    id: "child",
                    title: "Subobjetivo de prueba",
                    status: "ACTIVE",
                    parentGoalId: "parent"
                }
            ])
        );
    });
}

test("Estadísticas muestra el objetivo padre en subobjetivos", async ({ page }) => {
    await seedGoals(page);
    await page.goto("/");
    await page.locator("#showStatistics").click();
    await page.locator(
        'label[for="statisticsTabGoals"]'
    ).click();

    const parentCard = page.locator(
        ".statisticsGoalCard",
        {
            has: page.locator(
                '.openStatisticsGoal[data-id="parent"]'
            )
        }
    );
    const childCard = page.locator(
        ".statisticsGoalCard",
        {
            has: page.locator(
                '.openStatisticsGoal[data-id="child"]'
            )
        }
    );

    await expect(parentCard).toBeVisible();
    await expect(parentCard.locator(".statisticsGoalParent"))
        .toHaveCount(0);

    await expect(childCard).toBeVisible();
    await expect(childCard.locator(".statisticsGoalParent"))
        .toContainText("Objetivo padre: Objetivo principal");
});
