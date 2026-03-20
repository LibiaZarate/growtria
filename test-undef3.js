import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE foo (a, b, c)');
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, 2, undefined);
} catch (e) {
  console.log("Error defined:", e.name, e.message);
}
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, undefined, undefined);
} catch (e) {
  console.log("Error multiple undef:", e.name, e.message);
}
