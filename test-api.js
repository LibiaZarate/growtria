const http = require('http');

async function test() {
  const res = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "password" })
  });
  let token;
  if (res.ok) {
    token = (await res.json()).token;
  } else {
    // try login
    const res2 = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password" })
    });
    token = (await res2.json()).token;
  }
  console.log("Token:", !!token);

  const res3 = await fetch("http://localhost:3000/api/chat/send", {
    method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ message: "Hola" })
  });
  console.log("Chat response:", await res3.text());
}
test();
