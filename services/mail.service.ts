import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendResetEmail(to: string, resetLink: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!process.env.MAIL_FROM) {
    throw new Error("MAIL_FROM is not set");
  }

  await resend.emails.send({
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
}
