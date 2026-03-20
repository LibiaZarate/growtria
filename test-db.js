import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE foo (a, b, c)');
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, 2);
} catch (e) {
  console.log("Error 1:", e.message);
}
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run([1, 2, 3]);
} catch (e) {
  console.log("Error 2:", e.message);
}
