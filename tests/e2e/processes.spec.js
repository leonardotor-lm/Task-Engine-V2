import { test, expect } from "@playwright/test";

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    test(`procesos: crear, registrar avances, pausar y vincular con objetivos (${viewport.width})`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.addInitScript(() => {
            if (!localStorage.getItem("task-engine-v2-goals")) localStorage.setItem("task-engine-v2-goals", JSON.stringify([{ id: "goal-1", title: "Formación literaria", status: "ACTIVE" }]));
            if (!localStorage.getItem("task-engine-v2")) localStorage.setItem("task-engine-v2", JSON.stringify([{ id: "task-1", title: "Leer capítulo 8", status: "PENDING" }]));
        });
        await page.goto("/");
        if (viewport.width < 600) await page.locator("#toggleMobileMenu").click();
        await page.locator("#showProcesses").click();
        await page.getByRole("button", { name: "Nuevo proceso", exact: true }).click();
        const editor = page.locator("#processEditorForm");
        await editor.getByLabel("Título", { exact: true }).fill("Leer Cien años de soledad");
        await page.locator("#openSettings").evaluate(button => button.click());
        await page.locator("#closeSettings").click();
        await expect(editor.getByLabel("Título", { exact: true })).toHaveValue("Leer Cien años de soledad");
        await editor.getByLabel("Objetivo", { exact: true }).selectOption("goal-1");
        await editor.getByLabel("Medición", { exact: true }).selectOption("QUANTITY");
        await editor.getByLabel("Cantidad total").fill("417");
        await editor.getByLabel("Unidad", { exact: true }).fill("páginas");
        await editor.locator("details > summary").click();
        await editor.getByLabel("Leer capítulo 8", { exact: true }).check();
        await editor.getByRole("button", { name: "Guardar", exact: true }).click();
        await expect(page.locator(".processWorkspace h2")).toHaveText("Leer Cien años de soledad");
        const progress = page.locator("#processProgressForm");
        await progress.locator('[name="value"]').fill("176");
        await progress.getByLabel("Nota breve").fill("Llegué al capítulo 8");
        await progress.getByRole("button", { name: "Registrar avance" }).click();
        await expect(page.locator("progress")).toHaveAttribute("value", "176");
        await expect(page.locator(".processHistory")).toContainText("Llegué al capítulo 8");
        await page.getByRole("button", { name: "Editar proceso", exact: true }).click();
        await page.locator("#processEditorForm").getByLabel("Estado", { exact: true }).selectOption("PAUSED");
        await page.locator("#processEditorForm").getByRole("button", { name: "Guardar", exact: true }).click();
        await expect(page.locator("#processProgressForm")).toHaveCount(0);
        await page.locator('[data-process-goal="goal-1"]').click();
        await expect(page.locator(".processCard")).toContainText("176 / 417 páginas");
        await page.locator("[data-open-process]").click();
        await page.reload();
        await page.locator("#showProcesses").evaluate(button => button.click());
        await page.locator("#processStatusFilter").selectOption("PAUSED");
        await page.locator("[data-open-process]").click();
        await expect(page.locator(".processHistory")).toContainText("Llegué al capítulo 8");
        expect(errors).toEqual([]);
    });
}

test("procesos: sin medición y porcentaje permiten registrar y conservar avances", async ({ page }) => {
    await page.goto("/");
    for (const type of ["NONE", "PERCENTAGE"]) {
        await page.locator("#showProcesses").click();
        await page.getByRole("button", { name: "Nuevo proceso", exact: true }).click();
        const editor = page.locator("#processEditorForm");
        await editor.getByLabel("Título", { exact: true }).fill(`Estudiar ${type}`);
        await editor.getByLabel("Medición", { exact: true }).selectOption(type);
        await editor.getByRole("button", { name: "Guardar", exact: true }).click();
        const progress = page.locator("#processProgressForm");
        if (type === "PERCENTAGE") await progress.getByLabel("Porcentaje alcanzado").fill("42");
        await progress.getByLabel("Nota breve").fill("Leí un artículo");
        await progress.getByRole("button", { name: "Registrar avance" }).click();
        await expect(page.locator(".processHistory")).toContainText("Leí un artículo");
        if (type === "PERCENTAGE") await expect(page.locator("progress")).toHaveAttribute("value", "42");
        else await expect(page.locator("progress")).toHaveCount(0);
    }
});
