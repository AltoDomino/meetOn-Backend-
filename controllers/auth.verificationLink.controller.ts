// controllers/auth.verificationLink.controller.ts
import { Request, Response, NextFunction } from "express";
import { verifyEmail } from "../services/auth.verification.service"; // Twój serwis

export const verifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const token = String(req.query.token || "");
  try {
    await verifyEmail(token);

    // 1) Spróbuj otworzyć aplikację przez deep link
    const appLink = `meeton://verify-email?token=${encodeURIComponent(token)}`;

    // Jeśli chcesz, możesz po prostu zrobić:
    // return res.redirect(appLink);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
      <!doctype html>
      <html lang="pl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Weryfikacja e-maila</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0d1a4d; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
            .card { background:#12235e; border-radius:16px; padding:24px; text-align:center; max-width:480px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
            a.btn { display:inline-block; margin-top:16px; background:#00A9F4; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700; }
          </style>
          <script>
            // Spróbuj otworzyć aplikację automatycznie
            window.onload = function() {
              const link = '${appLink}';
              const now = Date.now();
              // próba otwarcia schematu
              window.location.href = link;

              // fallback po ~1.2s: zostawiamy stronę z przyciskiem
              setTimeout(function() {
                // nic – user zobaczy przycisk poniżej
              }, 1200);
            }
          </script>
        </head>
        <body>
          <div class="card">
            <h1>✅ E-mail został zweryfikowany</h1>
            <p>Jeśli aplikacja nie otworzyła się automatycznie, kliknij poniżej.</p>
            <a class="btn" href="${appLink}">Otwórz aplikację</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    // Token nieprawidłowy/wygasł – pokaż stronę z informacją
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(400).send(`
      <!doctype html>
      <html lang="pl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Weryfikacja e-maila</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#0d1a4d; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
            .card { background:#12235e; border-radius:16px; padding:24px; text-align:center; max-width:480px; box-shadow:0 10px 30px rgba(0,0,0,.25); }
            a.btn { display:inline-block; margin-top:16px; background:#00A9F4; color:#fff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>❌ Link jest nieprawidłowy lub wygasł</h1>
            <p>Spróbuj ponownie zarejestrować konto w aplikacji.</p>
          </div>
        </body>
      </html>
    `);
  }
};
