import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
    new URL(
        "../google-apps-script/Code.gs",
        import.meta.url
    ),
    "utf8"
);

function loadBackend() {

    const context = { console };

    vm.createContext(context);
    vm.runInContext(source, context);

    return context;

}

function snapshot(revision) {

    return {
        format: "task-engine-v2-backup",
        version: 1,
        exportedAt:
            "2026-09-05T03:00:00.000Z",
        data: {
            tasks: [],
            areas: [],
            contexts: [],
            tags: [],
            goals: [],
            projectPinPreferences: {
                [`project-${revision}`]: true
            }
        }
    };

}

class FakeSheet {

    constructor(spreadsheet, name, values = []) {
        this.spreadsheet = spreadsheet;
        this.name = name;
        this.values = values;
    }

    getLastRow() {
        return this.values.length;
    }

    getRange(row, column, rowCount = 1, columnCount = 1) {

        const sheet = this;

        return {
            getValue() {
                return sheet.values[row - 1]?.[
                    column - 1
                ];
            },
            getDisplayValue() {
                return String(
                    sheet.values[row - 1]?.[
                        column - 1
                    ] ?? ""
                );
            },
            getValues() {
                return sheet.values
                    .slice(row - 1, row - 1 + rowCount)
                    .map(values => values.slice(
                        column - 1,
                        column - 1 + columnCount
                    ));
            },
            setValues(values) {
                values.forEach((valuesRow, rowIndex) => {
                    const targetRow = row - 1 + rowIndex;
                    sheet.values[targetRow] ||= [];
                    valuesRow.forEach((value, columnIndex) => {
                        sheet.values[targetRow][
                            column - 1 + columnIndex
                        ] = value;
                    });
                });
            }
        };

    }

    setFrozenRows() {}

    setName(name) {
        this.name = name;
        return this;
    }

}

class FakeSpreadsheet {

    constructor() {
        this.sheets = [];
    }

    addSheet(name, values) {
        const sheet = new FakeSheet(
            this,
            name,
            values
        );
        this.sheets.push(sheet);
        return sheet;
    }

    insertSheet(name) {
        return this.addSheet(name, []);
    }

    getSheetByName(name) {
        return this.sheets.find(
            sheet => sheet.name === name
        ) || null;
    }

    deleteSheet(sheet) {
        this.sheets = this.sheets.filter(
            candidate => candidate !== sheet
        );
    }

}

function header() {
    return [
        "revision",
        "type",
        "id",
        "version",
        "updatedAt",
        "payload"
    ];
}

test("la compactación conserva sólo las últimas cinco revisiones completas", () => {

    const backend = loadBackend();
    const spreadsheet = new FakeSpreadsheet();
    const rows = [];

    for (let revision = 1; revision <= 8; revision += 1) {
        rows.push(...backend.snapshotToRows_(
            snapshot(revision),
            revision
        ));
    }

    const dataSheet = spreadsheet.addSheet(
        "TaskEngineData",
        [header(), ...rows]
    );
    const retained = backend.getRecentRevisionRows_(
        dataSheet,
        8,
        5
    );
    const revisions = [
        ...new Set(retained.map(row => row[0]))
    ];

    assert.deepEqual(revisions, [4, 5, 6, 7, 8]);

    for (const revision of revisions) {
        assert.deepEqual(
            JSON.parse(JSON.stringify(
                backend.rowsToSnapshotData_(
                    retained.filter(
                        row => row[0] === revision
                    )
                )
            )),
            snapshot(revision).data
        );
    }

});

test("la compactación respalda, verifica y reemplaza la hoja activa", () => {

    const backend = loadBackend();
    const spreadsheet = new FakeSpreadsheet();
    const rows = [];

    for (let revision = 1; revision <= 7; revision += 1) {
        rows.push(...backend.snapshotToRows_(
            snapshot(revision),
            revision
        ));
    }

    const original = spreadsheet.addSheet(
        "TaskEngineData",
        [header(), ...rows]
    );
    const meta = spreadsheet.addSheet(
        "TaskEngineMeta",
        [
            ["revision", "updatedAt", "version"],
            [7, "2026-09-05T03:00:00.000Z", 1]
        ]
    );
    let backupContent = "";
    let lockReleased = false;

    backend.getSpreadsheet_ = () => spreadsheet;
    backend.ensureStorage_ = () => ({
        dataSheet: original,
        metaSheet: meta
    });
    backend.LockService = {
        getScriptLock() {
            return {
                tryLock: () => true,
                releaseLock() {
                    lockReleased = true;
                }
            };
        }
    };
    backend.SpreadsheetApp = { flush() {} };
    backend.DriveApp = {
        createFile(name, content) {
            backupContent = content;
            return {
                getId: () => "backup-id",
                getName: () => name,
                getUrl: () => "https://drive.test/backup-id"
            };
        }
    };

    const result = backend.compactTaskEngineStorage_(true);
    const active = spreadsheet.getSheetByName(
        "TaskEngineData"
    );
    const activeRows = active.values.slice(1);

    assert.equal(result.compacted, true);
    assert.equal(result.revision, 7);
    assert.equal(result.revisionsKept, 5);
    assert.equal(lockReleased, true);
    assert.equal(spreadsheet.sheets.length, 2);
    assert.ok(active);
    assert.notEqual(active, original);
    assert.deepEqual(
        [...new Set(activeRows.map(row => row[0]))],
        [3, 4, 5, 6, 7]
    );
    assert.deepEqual(
        JSON.parse(backupContent).data,
        snapshot(7).data
    );

});

test("el mantenimiento automático no compacta debajo de 50.000 filas", () => {

    const backend = loadBackend();
    const spreadsheet = new FakeSpreadsheet();
    const original = spreadsheet.addSheet(
        "TaskEngineData",
        [header()]
    );
    const meta = spreadsheet.addSheet(
        "TaskEngineMeta",
        [
            ["revision", "updatedAt", "version"],
            [0, "", 1]
        ]
    );

    backend.getSpreadsheet_ = () => spreadsheet;
    backend.ensureStorage_ = () => ({
        dataSheet: original,
        metaSheet: meta
    });
    backend.LockService = {
        getScriptLock() {
            return {
                tryLock: () => true,
                releaseLock() {}
            };
        }
    };

    assert.deepEqual(
        JSON.parse(JSON.stringify(
            backend.compactTaskEngineStorage_(false)
        )),
        {
            compacted: false,
            reason: "BELOW_THRESHOLD",
            rows: 1
        }
    );

});
