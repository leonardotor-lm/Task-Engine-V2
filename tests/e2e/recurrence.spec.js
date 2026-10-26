import { test, expect } from "@playwright/test";

test("recurrencia: recargar una pendiente vencida no crea instancias; completar crea una", async ({ page }) => {
    await page.addInitScript(() => {
        if (localStorage.getItem("task-engine-v2")) return;
        localStorage.setItem("task-engine-v2", JSON.stringify([{
            id: "recurring", title: "Revisar planificación", status: "PENDING",
            recurrenceId: "series-1", recurrence: "DAILY",
            recurrenceInterval: 3, dueDate: "2026-01-01"
        }]));
    });
    const readTasks = () => page.evaluate(() =>
        JSON.parse(localStorage.getItem("task-engine-v2"))
    );
    await page.goto("/");
    await page.locator("#showAll").click();
    expect(await readTasks()).toHaveLength(1);
    await page.reload();
    await page.locator("#showAll").click();
    expect(await readTasks()).toHaveLength(1);
    await page.locator('.task[data-id="recurring"] .taskCompleteCheckbox').click();
    await expect.poll(async () => (await readTasks()).length).toBe(2);
    const tasks = await readTasks();
    expect(tasks.find(task => task.id === "recurring").status).toBe("COMPLETED");
    const next = tasks.find(task => task.id !== "recurring");
    expect(next.status).toBe("PENDING");
    expect(next.dueDate).toBe("2026-01-04");
    await page.reload();
    await page.locator("#showAll").click();
    expect(await readTasks()).toHaveLength(2);
});
