import { Process } from "../domain/Process.js";
import { ProcessEntry } from "../domain/ProcessEntry.js";

// Persist before replacing the in-memory collection so failed writes stay atomic.
class CollectionRepository {
    constructor(key, Entity, storage = localStorage) {
        this.key = key;
        this.Entity = Entity;
        this.storage = storage;
        this.items = JSON.parse(storage.getItem(key) ?? "[]").map(item => new Entity(item));
    }
    getAll() { return [...this.items]; }
    getById(id) { return this.items.find(item => item.id === id) ?? null; }
    replaceAll(items) {
        this.storage.setItem(this.key, JSON.stringify(items.map(item => item.toJSON())));
        this.items = [...items];
    }
    add(data) {
        const item = new this.Entity(data);
        this.replaceAll([...this.items, item]);
        return item;
    }
    update(item) {
        if (!this.getById(item.id)) throw new Error("El proceso no existe.");
        this.replaceAll(this.items.map(current => current.id === item.id ? item : current));
        return item;
    }
}
export class ProcessRepository extends CollectionRepository {
    constructor(storage) { super("task-engine-v2-processes", Process, storage); }
}
export class ProcessEntryRepository extends CollectionRepository {
    constructor(storage) { super("task-engine-v2-process-entries", ProcessEntry, storage); }
}
