import { test, expect } from "@playwright/test";

test("la aplicación carga sin errores de página y muestra la navegación principal", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));

    await page.goto("/");
    await page.waitForTimeout(100);

    expect(pageErrors).toEqual([]);

    await expect(page.locator("#appSidebar")).toBeVisible();
    await expect(page.locator("#sidebarPlanningGroup")).toBeVisible();
    await expect(page.locator("#aiSidebarTools")).toHaveCount(0);
});

test("los grupos Planificación y Asistencia con IA se pueden contraer y expandir", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem(
            "task-engine-v2-ai-enabled",
            "true"
        );
    });
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

test("Contexto conserva las filas de padre e hija en Todas", async ({ page }) => {
    await page.addInitScript(() => {
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
    await expect(page.locator('.task[data-id="padre"]')).toBeVisible();

    await page.locator("#taskGrouping").selectOption("CONTEXT");

    await expect(page.locator("#taskGrouping")).toHaveValue("CONTEXT");
    await expect(page.locator('.task[data-id="padre"]')).toBeVisible();
    await expect(page.locator('.task[data-id="hija"]')).toBeVisible();
});

test("quitar una etiqueta mantiene abierto el selector del editor", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem(
            "task-engine-v2-tags",
            JSON.stringify([{
                id: "tag-prueba",
                name: "Prueba",
                color: "#336699",
                order: 0
            }])
        );
        localStorage.setItem(
            "task-engine-v2",
            JSON.stringify([{
                id: "tarea-etiquetada",
                title: "Tarea etiquetada",
                status: "PENDING",
                tagIds: ["tag-prueba"]
            }])
        );
    });

    await page.goto("/");
    await page.locator("#showAll").click();
    await page.locator(
        '.task[data-id="tarea-etiquetada"] .taskBody'
    ).click();

    const picker = page.locator(
        '[data-picker-id="taskTags"]'
    );
    const manager = picker.locator(
        ".searchableMultiSelectManager"
    );

    await manager.locator(":scope > summary").click();
    await expect(manager).toHaveAttribute("open", "");
    await picker.locator(
        ".searchableMultiSelectRemove"
    ).click();
    await expect(manager).toHaveAttribute("open", "");
});

test("el aviso de tarea completada se cierra automáticamente", async ({ page }) => {
    await page.goto("/");
    await page.locator("#showAll").click();

    await page.locator(
        ".taskCompleteCheckbox"
    ).first().click();

    const notice = page.locator(
        "#taskCompletionNotice"
    );
    await expect(notice).toBeVisible();
    await expect(notice).toHaveCount(0, {
        timeout: 9000
    });
});
