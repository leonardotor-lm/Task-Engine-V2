import { test, expect } from "@playwright/test";

async function openEditor(page) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => {
        localStorage.setItem(
            "task-engine-v2",
            JSON.stringify([
                {
                    id: "desktop-parent",
                    title: "Tarea de escritorio",
                    status: "PENDING",
                    isProject: false,
                    isWaiting: true,
                    attachments: [{
                        id: "file-1",
                        driveFileId: "drive-file-1",
                        name: "archivo-con-un-nombre-largo.pdf",
                        mimeType: "application/pdf",
                        url: "https://drive.google.com/file/d/drive-file-1/view",
                        size: 1000,
                        createdAt: "2026-09-02T12:00:00.000Z"
                    }],
                    notionPageId: "note-1",
                    notionPageUrl: "https://www.notion.so/note-1"
                }
            ])
        );
    });
    await page.goto("/");
    await page.locator("#showWaiting").click();
    await page.locator(
        '.task[data-id="desktop-parent"] .taskBody'
    ).click();
    await expect(page.locator(
        ".desktopTaskEditorToolRow"
    )).toBeVisible();
}

test("el editor de escritorio conserva el orden, estados y pie acordados", async ({ page }) => {
    await openEditor(page);
    const tools = page.locator(
        ".desktopTaskEditorToolRow > *"
    );
    await expect(tools).toHaveCount(8);
    await expect(page.locator(
        ".desktopTaskEditorToolRow"
    )).toHaveAttribute(
        "data-desktop-tool-order",
        "Etiquetas,Programación,Objetivos,Mover,Adjuntos,Notas,Subtareas,Opciones"
    );

    await expect(page.locator(
        ".desktopTaskEditorProperties > *"
    )).toHaveCount(4);
    await expect(page.locator(
        ".desktopTaskEditorProperties #taskIsWaiting"
    )).toHaveCount(0);
    await expect(page.locator(
        ".desktopTaskEditorOptionsTool #taskIsWaiting"
    )).toHaveCount(1);
    await expect(page.locator(
        ".desktopTaskEditorOptionsTool #taskIsProject"
    )).toHaveCount(1);

    await expect(page.locator(
        ".desktopTaskEditorWideTool .desktopTaskEditorPickerCount"
    ).first()).toHaveText("1");
    await expect(page.locator(
        '.desktopTaskEditorStateIndicator[aria-label="Tarea en espera"]'
    )).toBeVisible();
    await page.locator(
        ".desktopTaskEditorOptionsTool > summary"
    ).click();
    await page.locator(
        ".desktopTaskEditorOptionsTool #taskIsProject"
    ).check();
    await expect(page.locator(
        '.desktopTaskEditorStateIndicator[aria-label="Tarea configurada como proyecto"]'
    )).toBeVisible();

    const footerIds = await page.locator(
        ".desktopTaskEditorFooter"
    ).evaluate(footer => ({
        left: [...footer.querySelector(
            ".desktopTaskEditorAdministrativeActions"
        ).children].map(item => item.id),
        right: [...footer.querySelector(
            ".desktopTaskEditorPrimaryActions"
        ).children].map(item => item.id)
    }));
    expect(footerIds.left).toEqual(["archiveTask", "deleteTask"]);
    expect(footerIds.right).toEqual(["toggleTask", "saveTask"]);
});

test("los popovers son exclusivos, contenidos y recuperan el foco", async ({ page }) => {
    await openEditor(page);
    const tools = page.locator(".desktopTaskEditorToolRow");
    const attachments = tools.locator(
        ".desktopTaskEditorSectionTool",
        { has: page.locator("summary", { hasText: "Adjuntos" }) }
    );
    const notes = tools.locator(
        ".desktopTaskEditorSectionTool",
        { has: page.locator("summary", { hasText: "Notas" }) }
    );
    const attachmentsButton = attachments.locator(":scope > summary");
    const notesButton = notes.locator(":scope > summary");

    await attachmentsButton.click();
    await expect(attachments).toHaveAttribute("open", "");
    const panel = attachments.locator(
        ":scope > .desktopTaskEditorPopover"
    );
    const box = await panel.boundingBox();
    expect(box.width).toBeLessThanOrEqual(420);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(1280);
    expect(box.y).toBeLessThan((await attachments.boundingBox()).y);

    await notesButton.click();
    await expect(notes).toHaveAttribute("open", "");
    await expect(attachments).not.toHaveAttribute("open", "");
    await page.keyboard.press("Escape");
    await expect(notes).not.toHaveAttribute("open", "");
    await expect(notesButton).toBeFocused();

    await attachmentsButton.click();
    await attachments.locator(
        ".desktopTaskEditorPopoverClose"
    ).click();
    await expect(attachmentsButton).toBeFocused();

    await attachmentsButton.click();
    await page.mouse.click(10, 10);
    await expect(attachments).not.toHaveAttribute("open", "");
    await expect(attachmentsButton).toBeFocused();
});

test("Programación se abre completa dentro del editor y del viewport", async ({ page }) => {
    await openEditor(page);
    const planning = page.locator(
        ".desktopTaskEditorRecurrenceTool"
    );

    await planning.locator(":scope > summary").click();
    await expect(planning).toHaveAttribute("open", "");

    const panel = planning.locator(
        ":scope > .desktopTaskEditorPopover"
    );
    const [panelBox, drawerBox] = await Promise.all([
        panel.boundingBox(),
        page.locator(".desktopTaskEditorLayout").boundingBox()
    ]);

    expect(panelBox.x).toBeGreaterThanOrEqual(drawerBox.x);
    expect(panelBox.x + panelBox.width)
        .toBeLessThanOrEqual(drawerBox.x + drawerBox.width);
    expect(panelBox.y).toBeGreaterThanOrEqual(0);
    expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(800);
    expect(await panel.evaluate(node =>
        node.scrollHeight <= node.clientHeight ||
        getComputedStyle(node).overflowY === "auto"
    )).toBe(true);
});

test("el editor móvil conserva su estructura propia", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
        localStorage.setItem("task-engine-v2", JSON.stringify([{
            id: "mobile-task",
            title: "Tarea móvil",
            status: "PENDING"
        }]));
    });
    await page.goto("/");
    await page.locator("#showAll").evaluate(button => button.click());
    await page.locator(
        '.task[data-id="mobile-task"] .taskBody'
    ).click();
    await expect(page.locator(
        ".mobileTaskEditorCompactLayout"
    )).toBeVisible();
    await expect(page.locator(
        ".desktopTaskEditorToolRow"
    )).toHaveCount(0);
});
