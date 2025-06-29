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
}) => {
  const result = await prisma.event.create({
    data: {
      location: data.location,
      address: data.address,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      activity: data.activity,
      creatorId: data.creatorId,
      maxParticipants: data.spots,
    },
  });

  console.log("📝 Event zapisany:", result);
  return result;
};
