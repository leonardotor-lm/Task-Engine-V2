import { test, expect } from "@playwright/test";

test("Mover desde Opciones permite confirmar el destino en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
        if (localStorage.getItem("task-engine-v2")) return;
        localStorage.setItem("task-engine-v2", JSON.stringify([
            { id: "move-task", title: "Preparar clase", status: "PENDING" },
            { id: "move-project", title: "Plan de acción 1", status: "PENDING", isProject: true }
        ]));
    });
    await page.goto("/");
    await page.locator("#showAll").evaluate(button => button.click());
    await page.locator('.task[data-id="move-task"] .taskBody').click();

    const options = page.locator(".mobileTaskEditorCompactOverflow");
    const move = page.locator("#mobileTaskEditorMovePanel");
    const openMove = async () => {
        await options.locator(":scope > summary").click();
        await options.getByRole("button", { name: "Mover", exact: true }).click();
        await expect(options).not.toHaveAttribute("open", "");
        await expect(move).toHaveAttribute("open", "");
        await expect(page.locator("#taskMoveTargetSearch")).toBeFocused();
    };

    await openMove();
    await page.keyboard.press("Escape");
    await expect(move).not.toHaveAttribute("open", "");
    await expect(options.locator(":scope > summary")).toBeFocused();
    await openMove();
    await move.getByRole("button", { name: "Cerrar mover", exact: true }).click();
    await expect(move).not.toHaveAttribute("open", "");
    await expect(options.locator(":scope > summary")).toBeFocused();
    await openMove();
    await page.locator("#taskMoveTargetSearch").fill("Plan de acción");
    await page.locator("#taskMoveTarget").selectOption("move-project");

    const submit = page.locator("#moveTaskFromEditor");
    expect(await submit.evaluate(button => {
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return hit === button || button.contains(hit);
    })).toBe(true);
    await submit.click();
    const confirmation = page.getByRole("dialog", { name: "Mover tarea" });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Mover", exact: true }).click();
    await expect.poll(() => page.evaluate(() => {
        return JSON.parse(localStorage.getItem("task-engine-v2"))
            .find(task => task.id === "move-task")?.parentTaskId;
    })).toBe("move-project");
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("task-engine-v2"))
        .find(task => task.id === "move-task")?.parentTaskId)).toBe("move-project");
});
