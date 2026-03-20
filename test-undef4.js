import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE foo (a, b, c, d, e, f, g, h)');
try {
    db.prepare('INSERT INTO foo VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        "id",
        "runid",
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    );
    console.log("Success with undefined");
} catch (e) {
    console.log("Error caught:", e.name, e.message);
}
