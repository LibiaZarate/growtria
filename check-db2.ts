import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

try {
  const users = db.prepare("SELECT * FROM users").all();
  console.log("USERS:", users.map(u => ({ id: (u as any).id, email: (u as any).email })));

  const hubs = db.prepare("SELECT * FROM hub_pages").all();
  hubs.forEach((h: any, i) => {
    console.log(`\nHUB ${i}: User ID = ${h.user_id}, Title = ${h.title}`);
    console.log(`Products: ${h.products_json}`);
    console.log(`Bio: ${h.bio_text}`);
  });
} catch (e: any) {
  console.error("Error:", e.message);
}
