import { Resend } from "resend";

const now = () => new Date().toISOString();

const maskEmail = (email: string) => {
  const [u, d] = String(email || "").split("@");
  if (!d) return "***";
  const user = u.length <= 2 ? `${u[0] ?? ""}*` : `${u.slice(0, 2)}***`;
  return `${user}@${d}`;
};

export async function sendResetEmail(to: string, resetLink: string) {
  console.log("\n================ MAIL SERVICE / START ================");
  console.log({
    time: now(),
    to: maskEmail(to),
    hasKey: !!process.env.RESEND_API_KEY,
    mailFrom: process.env.MAIL_FROM ?? null,
    linkPreview: String(resetLink).slice(0, 50) + "…",
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
        <h2>Reset hasła</h2>
        <p>Kliknij w link poniżej, aby ustawić nowe hasło:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Link ważny 30 minut.</p>
        <br/>
        <small>Jeśli to nie Ty, zignoruj tę wiadomość.</small>
      `,
    });

    // Resend zwykle zwraca obiekt z "data" i "error" (zależy od wersji SDK)
    console.log("MAIL SERVICE / RESEND RESULT", {
      time: now(),
      result,
    });

    console.log("================ MAIL SERVICE / END OK ================\n");
    return result;
  } catch (e: any) {
    console.error("❌ MAIL SERVICE / ERROR", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name,
      stack: e?.stack,
    });
    console.log("================ MAIL SERVICE / END ERROR ================\n");
    throw e;
  }
}
