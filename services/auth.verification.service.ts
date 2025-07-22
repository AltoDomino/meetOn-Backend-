import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email: string, token: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const backendUrl = process.env.BACKEND_URL?.trim();

  if (!backendUrl) {
    throw new Error("Brak BACKEND_URL w zmiennych środowiskowych");
  }

  const link = `${backendUrl}/api/verification/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"meetOn" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: "Weryfikacja konta MeetOn",
    html: `
      <p>Cześć!</p>
      <p>Dziękujemy za rejestrację w MeetOn. Kliknij w poniższy link, aby zweryfikować swoje konto:</p>
      <a href="${link}">${link}</a>
      <p>Link wygaśnie za 24 godziny.</p>
    `,
  });
};
