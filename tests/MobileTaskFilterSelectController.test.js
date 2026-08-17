import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
    MobileTaskFilterSelectController
} from "../src/ui/MobileTaskFilterSelectController.js";

test("sólo activa los selectores propios en viewport móvil", () => {

    const mobile = new MobileTaskFilterSelectController(
        { mainView: {} },
        {
            documentRef: null,
            windowRef: {
                matchMedia: () => ({ matches: true })
            }
        }
    );
    const desktop = new MobileTaskFilterSelectController(
        { mainView: {} },
        {
            documentRef: null,
            windowRef: {
                matchMedia: () => ({ matches: false })
            }
        }
    );

    assert.equal(mobile.isMobileViewport(), true);
    assert.equal(desktop.isMobileViewport(), false);

});

test("la integración conserva el select real y evita el selector nativo visible", async () => {

    const main = await readFile(
        new URL("../src/main.js", import.meta.url),
        "utf8"
    );
    const controller = await readFile(
        new URL(
            "../src/ui/MobileTaskFilterSelectController.js",
            import.meta.url
        ),
        "utf8"
    );
    const styles = await readFile(
        new URL(
            "../styles/mobile-filter-selects.css",
            import.meta.url
        ),
        "utf8"
    );

    assert.match(main, /MobileTaskFilterSelectController/);
    assert.match(
        main,
        /mobileTaskFilterSelectController\.start\(\)/
    );
    assert.match(controller, /taskFilterForm/);
    assert.match(controller, /mobileFilterNativeSelect/);
    assert.match(controller, /mobileFilterSelectOption/);
    assert.match(controller, /select\.value = option\.value/);
    assert.match(styles, /@media \(max-width: 760px\)/);
    assert.match(styles, /\.mobileFilterSelectMenu/);
    assert.match(styles, /position: fixed/);

});
