import { Goal } from "../domain/Goal.js";

const STORAGE_KEY = "task-engine-v2-goals";

export class GoalRepository {

    constructor() {

        this.goals = [];

        this.load();

    }

    load() {

        const json = localStorage.getItem(STORAGE_KEY);

        if (!json) return;

        this.goals = JSON
            .parse(json)
            .map(data => new Goal(data));

    }

    save() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                this.goals.map(goal => goal.toJSON())
            )
        );

    }

    getAll() {

        return [...this.goals];

    }

    getById(id) {

        return this.goals.find(
            goal => goal.id === id
        ) ?? null;

    }

    add(data) {

        const goal = new Goal(data);

        this.goals.push(goal);

        this.save();

        return goal;

    }

    update(goal) {

        const index = this.goals.findIndex(
            item => item.id === goal.id
        );

        if (index === -1) {
            throw new Error("El objetivo no existe.");
        }

        this.goals[index] = goal;

        this.save();

    }

    remove(id) {

        this.goals = this.goals.filter(
            goal => goal.id !== id
        );

        this.save();

    }

    replaceAll(goals) {

        this.goals = [...goals];

        this.save();

    }

}
