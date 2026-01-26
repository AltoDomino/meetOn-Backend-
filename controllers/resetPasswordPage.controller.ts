import { Request, Response } from "express";

export const resetPasswordPageController = (req: Request, res: Response) => {
  const token = String(req.query.token || "");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Reset hasła – meetOn</title>
  <style>
    body { font-family: system-ui,-apple-system,Segoe UI,Roboto,sans-serif; background:#0d1a4d; color:#fff;
           display:flex; align-items:center; justify-content:center; height:100vh; margin:0; padding:18px; }
    .card { background:#12235e; border-radius:16px; padding:22px; max-width:520px; width:100%;
            box-shadow:0 10px 30px rgba(0,0,0,.25); }
    h1 { margin:0 0 10px; font-size:22px; }
    input { width:100%; padding:12px; border-radius:12px; border:none; margin-top:8px; font-size:16px; }
    button { width:100%; margin-top:14px; background:#3A8FB7; color:#fff; border:none; padding:12px 14px;
             border-radius:12px; font-weight:800; font-size:15px; cursor:pointer; }
    button:disabled { opacity:.65; cursor:not-allowed; }
    .msg { margin-top:12px; font-weight:700; }
    .err { color:#ffb4b4; }
    .ok { color:#b6ffcc; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Reset hasła</h1>
    <p style="opacity:.9">Ustaw nowe hasło dla swojego konta.</p>

    <div id="msg" class="msg"></div>

    <label style="font-weight:700;">Nowe hasło</label>
    <input id="p1" type="password" placeholder="Minimum 8 znaków" />

    <label style="font-weight:700; margin-top:12px; display:block;">Powtórz hasło</label>
    <input id="p2" type="password" placeholder="Powtórz nowe hasło" />

    <button id="btn">ZAPISZ NOWE HASŁO</button>
  </div>

<script>
  const token = ${JSON.stringify(token)};
  const msg = document.getElementById("msg");
  const btn = document.getElementById("btn");
  const p1 = document.getElementById("p1");
  const p2 = document.getElementById("p2");

  const show = (text, ok=false) => {
    msg.className = "msg " + (ok ? "ok" : "err");
    msg.textContent = text;
  };

  if (!token || token.length < 10) {
    show("Brak lub nieprawidłowy token.");
    btn.disabled = true;
  }

  btn.onclick = async () => {
    msg.textContent = "";
    const newPassword = p1.value || "";
    const confirmPassword = p2.value || "";

    if (newPassword.length < 8) return show("Hasło musi mieć co najmniej 8 znaków.");
    if (newPassword !== confirmPassword) return show("Hasła nie są takie same.");

    btn.disabled = true;
    btn.textContent = "Zapisywanie...";

    try {
      const res = await fetch("/api/login/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        show(data?.message || "Nie udało się zresetować hasła.");
        btn.disabled = false;
        btn.textContent = "ZAPISZ NOWE HASŁO";
        return;
      }

      show("Hasło zostało zmienione. Możesz się zalogować.", true);
      btn.textContent = "ZAPISANO ✅";
    } catch (e) {
      show("Błąd połączenia z serwerem.");
      btn.disabled = false;
      btn.textContent = "ZAPISZ NOWE HASŁO";
    }
  };
</script>
</body>
</html>
  `);
};
