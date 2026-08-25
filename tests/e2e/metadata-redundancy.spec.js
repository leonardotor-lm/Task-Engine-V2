import { test, expect } from "@playwright/test";

function seedTaskWithMetadata() {
    localStorage.setItem(
        "task-engine-v2-areas",
        JSON.stringify([{
            id: "personal",
            name: "Personal",
            color: "#c026d3"
        }])
    );
    localStorage.setItem(
        "task-engine-contexts",
        JSON.stringify([{
            id: "casa",
            name: "Casa",
            color: "#2563eb"
        }])
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1)
        .padStart(2, "0");
    const day = String(now.getDate())
        .padStart(2, "0");

    localStorage.setItem(
        "task-engine-v2",
        JSON.stringify([{
            id: "tarea-contextual",
            title: "Tarea contextual",
            status: "PENDING",
            areaId: "personal",
            contextId: "casa",
            dueDate: `${year}-${month}-${day}`,
            tagIds: []
        }])
    );
}

async function expectMetadata(page, {
    area,
    context,
    due
}) {
    const row = page.locator(
        '.task[data-id="tarea-contextual"]'
    );

    await expect(row.locator(".taskMetaArea"))
        .toHaveCount(area ? 1 : 0);
    await expect(row.locator(".taskMetaContext"))
        .toHaveCount(context ? 1 : 0);
    await expect(row.locator(".taskDueDate"))
        .toHaveCount(due ? 1 : 0);
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(seedTaskWithMetadata);
    await page.goto("/");
    await page.locator("#showAll").click();
});

test("el agrupamiento oculta sólo el metadato que ya expresa", async ({ page }) => {
    await expectMetadata(page, {
        area: true,
        context: true,
        due: true
    });

    await page.locator("#taskGrouping")
        .selectOption("AREA");
    await expectMetadata(page, {
        area: false,
        context: true,
        due: true
    });

    await page.locator("#taskGrouping")
        .selectOption("CONTEXT");
    await expectMetadata(page, {
        area: true,
        context: false,
        due: true
    });

    await page.locator("#taskGrouping")
        .selectOption("DATE");
    await expectMetadata(page, {
        area: true,
        context: true,
        due: false
    });
});

test("un filtro rápido de Área oculta sólo el Área repetida", async ({ page }) => {
    await page.locator("#taskGrouping")
        .selectOption("NONE");
    await page.locator("#openTaskTools").click();
    await page.locator("#filterArea")
        .selectOption("personal");
    await page.locator(
        'button[form="taskFilterForm"]'
    ).click();

    await expectMetadata(page, {
        area: false,
        context: true,
        due: true
    });
});

test("la búsqueda avanzada conserva los metadatos normales", async ({ page }) => {
    await page.locator("#toggleAdvancedSearch").click();
    await page.locator("#advancedSearchInput")
        .fill("area:Personal");
    await page.locator("#advancedSearchForm")
        .evaluate(form => form.requestSubmit());

    await expect(
        page.locator(".advancedSearchActiveNotice")
    ).toBeVisible();
    await expectMetadata(page, {
        area: true,
        context: true,
        due: true
    });
});
