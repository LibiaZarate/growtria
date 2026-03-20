import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE foo (a, b, c)');
try {
    db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, 2);
} catch (e) {
    console.log("Error Too Few:", e.message);
}
console.log("Before undefined test");
try {
    db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, 2, undefined);
    console.log("Inserted undefined successfully?");
} catch (e) {
    console.log("Error undefined:", e.message);
}
