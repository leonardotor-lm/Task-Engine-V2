import { test, expect } from "@playwright/test";

test("una captura compartida abre el editor con título notas y enlace", async ({
    page
}) => {
    const query = new URLSearchParams({
        title: "Artículo para Literatura",
        text: "Revisar para la próxima clase",
        url: "https://example.com/articulo"
    });

    await page.goto(`/?${query}`);

    await expect(page.locator("#taskTitleEdit"))
        .toHaveValue("Artículo para Literatura");
    await expect(page.locator("#taskDescriptionEdit"))
        .toHaveValue(
            "Revisar para la próxima clase\n\nhttps://example.com/articulo"
        );
    await expect(page).toHaveURL("/");
});
