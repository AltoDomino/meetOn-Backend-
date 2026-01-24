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
  // Resend SDK często zwraca { data, error } zamiast rzucać wyjątek
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

export async function sendResetEmail(to: string, resetLink: string) {
  console.log("\n================ MAIL SERVICE / START ================");
  console.log("MAIL SERVICE / ENV CHECK", {
    time: now(),
    MAIL_FROM: process.env.MAIL_FROM ?? null,
    RESEND_API_KEY: maskKey(process.env.RESEND_API_KEY ?? null),
  });

  console.log("MAIL SERVICE / INPUT", {
    time: now(),
    to: maskEmail(to),
    linkPreview: String(resetLink).slice(0, 80) + "…",
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
      // ważne: gdy Resend zwraca error w result, a nie throw
      console.error("❌ MAIL SERVICE / RESEND returned error", {
        time: now(),
        ...normalized.error,
      });
    }

    console.log("================ MAIL SERVICE / END ================\n");
    return result;
  } catch (e: any) {
    // gdy SDK rzuci wyjątek
    console.error("❌ MAIL SERVICE / THROW", {
      time: now(),
      message: e?.message ?? String(e),
      name: e?.name ?? null,
      statusCode: e?.statusCode ?? null,
      stack: e?.stack ?? null,
    });

    // czasem response siedzi w e.response / e.error
    console.error("❌ MAIL SERVICE / THROW DETAILS", {
      time: now(),
      response: e?.response ?? null,
      error: e?.error ?? null,
    });

    console.log("================ MAIL SERVICE / END ERROR ================\n");
    throw e;
  }
}
