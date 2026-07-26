import test from "node:test";
import assert from "node:assert/strict";
import {
    readFileSync
} from "node:fs";

const indexHtml = readFileSync(
    new URL("../index.html", import.meta.url),
    "utf8"
);

test("la página restringe scripts y conexiones externas", () => {

    assert.match(
        indexHtml,
        /http-equiv="Content-Security-Policy"/
    );

    assert.match(
        indexHtml,
        /script-src 'self'/
    );

    assert.match(
        indexHtml,
        /connect-src 'self' https:\/\/script\.google\.com https:\/\/script\.googleusercontent\.com/
    );

    assert.match(
        indexHtml,
        /object-src 'none'/
    );

});

test("la página no envía información de referencia", () => {

    assert.match(
        indexHtml,
        /name="referrer" content="no-referrer"/
    );

});

test("la política no permite scripts inline", () => {

    const policy = indexHtml.match(
        /http-equiv="Content-Security-Policy"[\s\S]*?content="([^"]+)"/
    )?.[1] ?? "";

    const scriptDirective = policy
        .split(";")
        .find(
            directive =>
                directive.trim().startsWith(
                    "script-src"
                )
        ) ?? "";

    assert.doesNotMatch(
        scriptDirective,
        /'unsafe-inline'|'unsafe-eval'/
    );

});
