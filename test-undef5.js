import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE foo (a, b, c)');
try {
    db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, undefined, 3);
    console.log('Test 1 (middle): Success');
} catch (e) {
    console.log('Test 1:', e.name, e.message);
}

try {
    db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, 2, undefined);
    console.log('Test 2 (trailing): Success');
} catch (e) {
    console.log('Test 2:', e.name, e.message);
}
