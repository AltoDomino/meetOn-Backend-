// src/services/mail.service.ts
import { Resend } from "resend";

const now = () => new Date().toISOString();

const maskEmail = (email: string) => {
  const [u, d] = String(email || "").split("@");
  if (!d) return "***";
  const user = u.length <= 2 ? `${u[0] ?? ""}*` : `${u.slice(0, 2)}***`;
  return `${user}@${d}`;
};

const maskKey = (key?: string | null) => {
  if (!key) return null;
  if (key.length <= 10) return "***";
  return `${key.slice(0, 6)}…${key.slice(-4)} (len=${key.length})`;
};

const normalizeResendResult = (result: any) => {
  const data = result?.data ?? null;
  const error = result?.error ?? null;

  return {
    hasData: !!data,
    hasError: !!error,
    data: data ? { id: data?.id ?? null } : null,
    error: error
      ? {
          statusCode: error?.statusCode ?? null,
          message: error?.message ?? null,
          name: error?.name ?? null,
        }
      : null,
  };
};

/**
 * Wysyła mail do resetu hasła.
 * Uwaga: resetLink ma być HTTP(S) do strony (Vercel), żeby był klikalny w Gmailu.
 */
export async function sendResetEmail(to: string, resetLink: string) {
  console.log("\n================ MAIL SERVICE / START ================");
  console.log("MAIL SERVICE / ENV CHECK", {
    time: now(),
    MAIL_FROM: process.env.MAIL_FROM ?? null,
    FRONTEND_URL: process.env.FRONTEND_URL ?? null,
    RESEND_API_KEY: maskKey(process.env.RESEND_API_KEY ?? null),
  });

  console.log("MAIL SERVICE / INPUT", {
    time: now(),
    to: maskEmail(to),
    linkPreview: String(resetLink).slice(0, 90) + "…",
  });

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ MAIL SERVICE / RESEND_API_KEY missing");
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!process.env.MAIL_FROM) {
    console.error("❌ MAIL SERVICE / MAIL_FROM missing");
    throw new Error("MAIL_FROM is not set");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const result = await resend.emails.send({
      from: `meetOn <${process.env.MAIL_FROM}>`,
      to,
      subject: "Reset hasła – meetOn",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Reset hasła</h2>
          <p>Kliknij w przycisk poniżej, aby ustawić nowe hasło:</p>

          <p style="margin: 18px 0;">
            <a href="${resetLink}"
               style="display:inline-block;padding:12px 16px;text-decoration:none;border-radius:10px;background:#3A8FB7;color:#ffffff;font-weight:700;">
              Ustaw nowe hasło
            </a>
          </p>

          <p>Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>

          <p style="margin-top:18px;">Link ważny 30 minut.</p>
          <small>Jeśli to nie Ty, zignoruj tę wiadomość.</small>
        </div>
      `,
    });

    const normalized = normalizeResendResult(result);

    console.log("MAIL SERVICE / RESEND RAW RESULT", {
      time: now(),
      result,
    });

    console.log("MAIL SERVICE / RESEND NORMALIZED", {
      time: now(),
      ...normalized,
    });

    if (normalized.hasError) {
      console.error("❌ MAIL SERVICE / RESEND returned error", {
        time: now(),
        ...normalized.error,
      });
    }

    console.log("================ MAIL SERVICE / END ================\n");
    return result;
  } catch (e: any) {
    console.error("❌ MAIL SERVICE / THROW", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name ?? null,
      statusCode: e?.statusCode ?? null,
      stack: e?.stack ?? null,
    });

    console.error("❌ MAIL SERVICE / THROW DETAILS", {
      time: now(),
      response: e?.response ?? null,
      error: e?.error ?? null,
    });

    console.log("================ MAIL SERVICE / END ERROR ================\n");
    throw e;
  }
}
