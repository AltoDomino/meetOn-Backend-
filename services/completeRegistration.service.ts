import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

interface CompleteRegistrationInput {
  age: number;
  gender: string;
  dateOfBirth?: string;   // na przyszłość, jeśli dodasz pole w modelu
  description?: string;
}

export async function completeRegistrationService(
  userId: number,
  input: CompleteRegistrationInput
): Promise<User> {
  const { age, gender, description } = input;

  const dataToUpdate: any = {
    isRegistrationComplete: true,
    age: Number(age),
    gender: String(gender),
  };

  if (typeof description === "string") {
    dataToUpdate.description = description.trim();
  }

  // Jeśli kiedyś dodasz dateOfBirth w modelu:
  // if (input.dateOfBirth) {
  //   const dob = new Date(input.dateOfBirth);
  //   if (!isNaN(dob.getTime())) {
  //     dataToUpdate.dateOfBirth = dob;
  //   }
  // }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });

  return updatedUser;
}
