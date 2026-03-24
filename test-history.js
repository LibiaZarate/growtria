async function run() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@admin.com", password: "admin" }) // GUESSING USER CREDENTIALS
  });
  const data = await res.json();
  if(!data.token) {
    console.log("Login failed", data);
    return;
  }
  const hist = await fetch("http://localhost:3000/api/history", {
    headers: { "Authorization": "Bearer " + data.token }
  });
  console.log("Status:", hist.status);
  console.log("Response text:", await hist.text());
}
run();
