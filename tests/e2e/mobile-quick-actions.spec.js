import { test, expect } from "@playwright/test";

test("la hoja móvil conserva alineados dibujo y toque desde cualquier fila", async ({ page }) => {

    await page.setViewportSize({
        width: 390,
        height: 844
    });
    await page.addInitScript(() => {

        localStorage.setItem(
            "task-engine-v2",
            JSON.stringify(
                Array.from(
                    { length: 24 },
                    (_, index) => ({
                        id: `mobile-${index}`,
                        title: `Tarea móvil ${index}`,
                        status: "PENDING",
                        manualOrder: index
                    })
                )
            )
        );

    });

    await page.goto("/");
    await page.locator("#showAll").click();

    const verifyCloseTarget = async taskId => {

        const task = page.locator(
            `.task[data-id="${taskId}"]`
        );

        await task.evaluate(element => {
            element.scrollIntoView({
                block: "start",
                behavior: "instant"
            });
        });
        await task.locator(
            ".quickMoreActions > summary"
        ).click();

        const panel = page.locator(
            "body > .quickMoreMenuPortaled"
        );
        const close = panel.locator(
            ".closeQuickActions"
        );

        await expect(panel).toBeVisible();
        await expect(close).toBeVisible();

        const hitMatchesClose = await close.evaluate(
            element => {
                const bounds =
                    element.getBoundingClientRect();
                const hit = document.elementFromPoint(
                    bounds.left + bounds.width / 2,
                    bounds.top + bounds.height / 2
                );

                return hit === element ||
                    element.contains(hit);
            }
        );

        expect(hitMatchesClose).toBe(true);

        await close.click();
        await expect(panel).toHaveCount(0);
        await expect(task.locator(
            ".quickMoreActions"
        )).not.toHaveAttribute("open", "");

    };

    await verifyCloseTarget("mobile-0");
    await verifyCloseTarget("mobile-20");

});
