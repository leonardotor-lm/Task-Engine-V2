import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const backendSource = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);
const backupSource = readFileSync(
    new URL(
        "../google-apps-script/MaintenanceBackups.gs",
        import.meta.url
    ),
    "utf8"
);

function snapshot() {
    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt: "2026-09-10T03:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            goals: []
        }
    };
}

class FakeFile {

    constructor(name, content, createdAt) {
        this.name = name;
        this.content = content;
        this.createdAt = createdAt || new Date();
        this.trashed = false;
        this.id = `file-${FakeFile.nextId += 1}`;
    }

    getId() { return this.id; }
    getName() { return this.name; }
    getUrl() { return `https://drive.test/${this.id}`; }
    getDateCreated() { return this.createdAt; }
    setTrashed(value) { this.trashed = value; }
    getBlob() {
        return {
            getDataAsString: () => this.content
        };
    }

}

FakeFile.nextId = 0;

class FakeFolder {

    constructor(name) {
        this.name = name;
        this.folders = [];
        this.files = [];
    }

    getFoldersByName(name) {
        return iterator(
            this.folders.filter(folder =>
                folder.name === name
            )
        );
    }

    createFolder(name) {
        const folder = new FakeFolder(name);
        this.folders.push(folder);
        return folder;
    }

    getFilesByName(name) {
        return iterator(
            this.files.filter(file =>
                file.name === name && !file.trashed
            )
        );
    }

    getFiles() {
        return iterator(
            this.files.filter(file => !file.trashed)
        );
    }

    createFile(name, content) {
        const file = new FakeFile(name, content);
        this.files.push(file);
        return file;
    }

}

function iterator(items) {
    let index = 0;
    return {
        hasNext: () => index < items.length,
        next: () => items[index++]
    };
}

function loadBackend() {

    const root = new FakeFolder("Task Engine V2");
    const spreadsheet = {
        getId: () => "sheet-12345678-abcdef",
        getName: () => "Task Engine V2 DB"
    };
    const spreadsheetFile = {
        getParents: () => iterator([root])
    };
    const context = {
        console,
        Session: {
            getScriptTimeZone: () => "UTC"
        },
        Utilities: {
            formatDate(date, timezone, pattern) {
                assert.equal(timezone, "UTC");
                const iso = date.toISOString();
                if (pattern === "dd") {
                    return iso.slice(8, 10);
                }
                return pattern === "yyyy-MM-dd"
                    ? iso.slice(0, 10)
                    : iso.slice(0, 19)
                        .replace("T", "-")
                        .replaceAll(":", "-");
            }
        },
        DriveApp: {
            getFileById(id) {
                assert.equal(id, spreadsheet.getId());
                return spreadsheetFile;
            }
        }
    };

    vm.createContext(context);
    vm.runInContext(backendSource, context);
    vm.runInContext(backupSource, context);
    context.getSpreadsheet_ = () => spreadsheet;

    return { backend: context, root };

}

test("guarda y verifica el respaldo en la carpeta aislada de la instalación", () => {

    const { backend, root } = loadBackend();
    const result = backend.createTaskEngineBackupFile_(
        snapshot(),
        7,
        "AUTOMATIC",
        new Date("2026-09-10T03:00:00.000Z")
    );
    const maintenance = root.folders[0];
    const installation = maintenance.folders[0];
    const automatic = installation.folders[0];

    assert.equal(
        maintenance.name,
        "Mantenimiento y respaldos"
    );
    assert.equal(
        installation.name,
        "Task Engine V2 DB — sheet-12"
    );
    assert.equal(automatic.name, "Automáticos");
    assert.equal(automatic.files.length, 1);
    assert.match(
        automatic.files[0].name,
        /^task-engine-auto-2026-09-10-rev-7\.json$/
    );
    assert.equal(result.verified, true);
    assert.deepEqual(
        JSON.parse(JSON.stringify(result.counts)),
        {
            tasks: 0,
            areas: 0,
            contexts: 0,
            tags: 0,
            goals: 0,
            activityEvents: 0
        }
    );

});

test("la copia mensual se decide con la zona horaria del proyecto", () => {

    const { backend } = loadBackend();

    assert.equal(
        backend.shouldCreateTaskEngineMonthlyBackup_(
            new Date("2026-10-01T03:00:00.000Z")
        ),
        true
    );
    assert.equal(
        backend.shouldCreateTaskEngineMonthlyBackup_(
            new Date("2026-10-02T03:00:00.000Z")
        ),
        false
    );

});

test("la rotación envía a papelera sólo las copias más antiguas", () => {

    const { backend } = loadBackend();
    const folder = new FakeFolder("Automáticos");

    for (let day = 1; day <= 5; day += 1) {
        folder.files.push(new FakeFile(
            `task-engine-auto-${day}.json`,
            "{}",
            new Date(`2026-09-0${day}T03:00:00Z`)
        ));
    }
    folder.files.push(new FakeFile(
        "archivo-ajeno.json",
        "{}",
        new Date("2020-01-01T00:00:00Z")
    ));

    const rotated =
        backend.rotateTaskEngineBackupFiles_(
            folder,
            "task-engine-auto-",
            3
        );

    assert.equal(rotated, 2);
    assert.equal(folder.files[0].trashed, true);
    assert.equal(folder.files[1].trashed, true);
    assert.equal(folder.files[2].trashed, false);
    assert.equal(folder.files[5].trashed, false);

});

test("rechaza un respaldo corrupto antes de restaurarlo", () => {

    const { backend } = loadBackend();

    assert.throws(
        () => backend.inspectTaskEngineBackupContent_(
            "{invalid"
        ),
        error => error.code === "INVALID_BACKUP_JSON"
    );

});

test("la restauración crea una copia de seguridad antes de guardar", () => {

    const { backend } = loadBackend();
    const source = new FakeFile(
        "respaldo.json",
        JSON.stringify(snapshot())
    );
    source.id = "source-backup";
    const order = [];

    backend.DriveApp.getFileById = id => {
        assert.equal(id, "source-backup");
        return source;
    };
    backend.loadSnapshot_ = () => ({
        revision: 8,
        data: snapshot()
    });
    backend.createTaskEngineBackupFile_ = (
        currentSnapshot,
        revision,
        kind,
        now,
        suffix
    ) => {
        order.push("safety-backup");
        assert.equal(revision, 8);
        assert.equal(kind, "MANUAL");
        assert.equal(suffix, "antes-de-restaurar");
        return { id: "safety-backup" };
    };
    backend.saveSnapshot_ = (
        restoredSnapshot,
        baseRevision
    ) => {
        order.push("save");
        assert.equal(baseRevision, 8);
        assert.equal(
            restoredSnapshot.format,
            "task-engine-v2-backup"
        );
        return { revision: 9 };
    };

    const result =
        backend.restoreTaskEngineBackupFromDrive(
            "source-backup"
        );

    assert.deepEqual(order, [
        "safety-backup",
        "save"
    ]);
    assert.equal(result.restored, true);
    assert.equal(result.revision, 9);

});

test("el mantenimiento respalda antes de evaluar la compactación", () => {

    const { backend } = loadBackend();
    const order = [];

    backend.runTaskEngineBackupCycle_ = () => {
        order.push("backup");
        return { created: true };
    };
    backend.compactTaskEngineStorage_ = () => {
        order.push("compaction");
        return { compacted: false };
    };
    backend.recordTaskEngineMaintenanceDiagnostic_ = () => {
        order.push("diagnostic");
        return { recorded: true };
    };

    const result = backend.runTaskEngineMaintenance();

    assert.deepEqual(order, [
        "backup",
        "compaction",
        "diagnostic"
    ]);
    assert.equal(result.ok, true);

});
