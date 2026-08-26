import { test, expect } from "@playwright/test";

async function seedStatistics(page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            "task-engine-v2-areas",
            JSON.stringify([
                {
                    id: "personal",
                    name: "Personal",
                    color: "#c026d3"
                }
            ])
        );
        localStorage.setItem(
            "task-engine-v2",
            JSON.stringify([
                {
                    id: "done",
                    title: "Completada reciente",
                    status: "COMPLETED",
                    areaId: "personal",
                    completedAt: new Date().toISOString()
                },
                {
                    id: "pending",
                    title: "Pendiente ejecutable",
                    status: "PENDING",
                    areaId: "personal"
                },
                {
                    id: "waiting",
                    title: "Pendiente en espera",
                    status: "PENDING",
                    areaId: "personal",
                    isWaiting: true
                },
                {
                    id: "project",
                    title: "Proyecto de prueba",
                    status: "PENDING",
                    isProject: true
                },
                {
                    id: "child",
                    title: "Paso del proyecto",
                    status: "PENDING",
                    parentTaskId: "project"
                }
            ])
        );
    });
}

test("Estadísticas muestra Panorama y un solo desglose a la vez", async ({ page }) => {
    await seedStatistics(page);
    await page.goto("/");
    await page.locator("#showStatistics").click();

    await expect(
        page.getByRole("heading", { name: "Panorama general" })
    ).toBeVisible();
    await expect(page.locator("#statisticsPeriod"))
        .toBeVisible();

    await expect(page.locator("#statisticsTabAreas"))
        .toBeChecked();
    await expect(page.locator(".statisticsPanelAreas"))
        .toBeVisible();
    await expect(page.locator(".statisticsPanelProjects"))
        .not.toBeVisible();
    await expect(page.locator(".statisticsPanelGoals"))
        .not.toBeVisible();

    const personal = page.locator(".statisticsAreaRow", {
        hasText: "Personal"
    });
    await expect(personal).toContainText("50 %");
    await expect(personal).toContainText("1 completada");
    await expect(personal).toContainText("1 pendiente");
    await expect(personal.locator("strong"))
        .toHaveCSS("color", "rgb(192, 38, 211)");

    await page.locator(
        'label[for="statisticsTabProjects"]'
    ).click();
    await expect(page.locator("#statisticsTabProjects"))
        .toBeChecked();
    await expect(page.locator(".statisticsPanelAreas"))
        .not.toBeVisible();
    await expect(page.locator(".statisticsPanelProjects"))
        .toBeVisible();
    await expect(page.getByText("Proyecto de prueba"))
        .toBeVisible();
    await expect(
        page.getByRole("heading", { name: "Panorama general" })
    ).toBeVisible();

    await page.locator(
        'label[for="statisticsTabGoals"]'
    ).click();
    await expect(page.locator(".statisticsPanelGoals"))
        .toBeVisible();
    await expect(
        page.getByText("No hay objetivos para medir.")
    ).toBeVisible();
});

test("Estadísticas compactas caben en un ancho móvil", async ({ page }) => {
    await page.setViewportSize({
        width: 390,
        height: 844
    });
    await seedStatistics(page);
    await page.goto("/");

    await page.locator("#toggleMobileMenu").click();
    await page.locator("#showStatistics").click();

    await expect(page.locator(".statisticsPanelAreas"))
        .toBeVisible();

    const overflow = await page.locator(".statisticsView")
        .evaluate(element => ({
            scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth
        }));

    expect(overflow.scrollWidth)
        .toBeLessThanOrEqual(overflow.clientWidth + 1);

    await expect(page.locator(".statisticsTabs"))
        .toBeVisible();
    await expect(page.locator(".statisticsAreaRow"))
        .toBeVisible();
});
