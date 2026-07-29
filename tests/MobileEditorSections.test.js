import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const editor = await readFile(
    new URL(
        "../src/ui/TaskEditor.js",
        import.meta.url
    ),
    "utf8"
);

const mainView = await readFile(
    new URL(
        "../src/ui/MainView.js",
        import.meta.url
    ),
    "utf8"
);

test("el editor agrupa sus propiedades por función", () => {

    for (const title of [
        "Información principal",
        "Organización",
        "Planificación",
        "Subtareas"
    ]) {

        assert.match(
            editor,
            new RegExp(title)
        );

    }

});

test("organización y planificación comienzan contraídas", () => {

    assert.equal(
        (
            editor.match(
                /data-mobile-collapsed="true"/g
            ) ?? []
        ).length,
        2
    );

    assert.match(
        mainView,
        /removeAttribute\(\s*"open"/
    );

    assert.match(
        mainView,
        /max-width: 760px/
    );

    const secondarySections = [
        ...editor.matchAll(
            /<details\s+class="editorSection editorSecondarySection"[\s\S]*?>/g
        )
    ];

    assert.equal(
        secondarySections.length,
        2
    );

    for (const section of secondarySections) {
        assert.doesNotMatch(
            section[0],
            /\sopen/
        );
    }

});
