import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationExpires: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      userName: true,
      verificationExpires: true,
    }
  });

  if (!user) {
    throw new Error("Token jest nieprawidłowy lub wygasł.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
    },
    select: {
      id: true,
      email: true,
      userName: true,
    }
  });

  return { message: "E-mail został zweryfikowany!" };
};
