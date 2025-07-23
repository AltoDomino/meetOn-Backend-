import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createEvent = async (data: {
  location: string;
  address: string;
  startDate: string;
  endDate: string;
  activity: string;
  creatorId: number;
  spots: number;
  genderBalance?: boolean;
  latitude: number;  // Nowy parametr
  longitude: number; // Nowy parametr
}) => {
  try {
    // Tworzenie wydarzenia w bazie danych
    const result = await prisma.event.create({
      data: {
        location: data.location,
        address: data.address,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        activity: data.activity,
        creatorId: data.creatorId,
        maxParticipants: data.spots,
        genderBalance: data.genderBalance ?? false,
        latitude: data.latitude,   // Zapisujemy współrzędną szerokości
        longitude: data.longitude, // Zapisujemy współrzędną długości
      },
    });

    console.log("📝 Event zapisany:", result);
    return result;
  } catch (err) {
    console.error("❌ Błąd przy tworzeniu wydarzenia:", err);
    throw new Error("Błąd przy tworzeniu wydarzenia");
  }
};
