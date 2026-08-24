import { test, expect } from "@playwright/test";

test("la aplicación carga sin errores de página y muestra la navegación principal", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto("/");

    await expect(page.locator("#appSidebar")).toBeVisible();
    await expect(page.locator("#sidebarPlanningGroup")).toBeVisible();
    await expect(page.locator("#aiSidebarTools")).toBeVisible();
    expect(pageErrors).toEqual([]);
});

test("los grupos Planificación y Asistencia con IA se pueden contraer y expandir", async ({ page }) => {
    await page.goto("/");

    const planning = page.locator("#sidebarPlanningGroup");
    const ai = page.locator("#aiSidebarTools");

    await expect(planning).toHaveAttribute("open", "");
    await expect(ai).not.toHaveAttribute("open", "");

    await planning.locator(":scope > summary").click();
    await expect(planning).not.toHaveAttribute("open", "");

    await ai.locator(":scope > summary").click();
    await expect(ai).toHaveAttribute("open", "");
    await expect(page.locator("#openAiAssistant")).toBeVisible();
    await expect(page.locator("#openAiTaskQuality")).toBeVisible();
});

test("la navegación móvil abre y cierra la barra lateral", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const layout = page.locator(".layout");
    const toggle = page.locator("#toggleMobileMenu");

    await expect(toggle).toBeVisible();
    await expect(layout).not.toHaveClass(/mobileMenuOpen/);

    await toggle.click();
    await expect(layout).toHaveClass(/mobileMenuOpen/);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await page.locator("#mobileMenuBackdrop").click({ force: true });
    await expect(layout).not.toHaveClass(/mobileMenuOpen/);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
});

test("Todas muestra el selector de contexto persistido", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem(
            "task-engine-v2-task-grouping-by-view-v1",
            JSON.stringify({ "view:ALL": "CONTEXT" })
        );
        localStorage.setItem(
            "task-engine-contexts",
            JSON.stringify([
                { id: "casa", name: "Casa" },
                { id: "trabajo", name: "Trabajo" }
            ])
        );
        localStorage.setItem(
            "task-engine-v2",
            JSON.stringify([
                {
                    id: "padre",
                    title: "Proyecto padre",
                    status: "PENDING",
                    isProject: true,
                    parentTaskId: null,
                    contextId: "trabajo"
                },
                {
                    id: "hija",
                    title: "Subtarea hija",
                    status: "PENDING",
                    isProject: false,
                    parentTaskId: "padre",
                    contextId: "casa"
                }
            ])
        );
    });

    await page.goto("/");
    await page.locator("#showAll").click();

    await expect(page.locator("#showAll")).toHaveClass(/active/);
    await expect(page.locator(".taskListHeading h2")).toContainText("Todas");
    await expect(page.locator("#taskGrouping")).toHaveValue("CONTEXT");
});
