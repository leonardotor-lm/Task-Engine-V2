import test from "node:test";
import assert from "node:assert/strict";

import {
    PlanningNavigationController
} from "../src/ui/PlanningNavigationController.js";

function createNavigationFixture(includeWaiting = true) {

    const elements = new Map();
    const navigation = {
        children: [],
        querySelector(selector) {
            return selector === ".sidebarNavigationGroup"
                ? elements.get("history")
                : null;
        },
        insertBefore(element, reference) {
            this.children = this.children.filter(
                child => child !== element
            );
            const index = this.children.indexOf(reference);
            this.children.splice(index, 0, element);
        }
    };

    const make = id => ({ id, parentElement: navigation });

    for (const id of [
        "showAll",
        "showProjects",
        "showCalendar",
        "showGoals",
        "showStatistics",
        "history"
    ]) {
        elements.set(id, make(id));
    }

    if (includeWaiting) {
        elements.set("showWaiting", make("showWaiting"));
    }

    navigation.children = [
        elements.get("showWaiting"),
        elements.get("showAll"),
        elements.get("showProjects"),
        elements.get("showCalendar"),
        elements.get("showGoals"),
        elements.get("showStatistics"),
        elements.get("history")
    ].filter(Boolean);

    return { elements, navigation };

}

test("orders Planning as All, Projects, Goals, Waiting, Calendar, Statistics", () => {

    const { elements, navigation } =
        createNavigationFixture(true);

    globalThis.document = {
        getElementById(id) {
            return elements.get(id) ?? null;
        }
    };

    const controller =
        new PlanningNavigationController({});

    controller.applyPlanningOrder();

    assert.deepEqual(
        navigation.children.map(element => element.id),
        [
            "showAll",
            "showProjects",
            "showGoals",
            "showWaiting",
            "showCalendar",
            "showStatistics",
            "history"
        ]
    );

    delete globalThis.document;

});

test("keeps the same Planning order when Waiting is unavailable", () => {

    const { elements, navigation } =
        createNavigationFixture(false);

    globalThis.document = {
        getElementById(id) {
            return elements.get(id) ?? null;
        }
    };

    const controller =
        new PlanningNavigationController({});

    controller.applyPlanningOrder();

    assert.deepEqual(
        navigation.children.map(element => element.id),
        [
            "showAll",
            "showProjects",
            "showGoals",
            "showCalendar",
            "showStatistics",
            "history"
        ]
    );

    delete globalThis.document;

});
