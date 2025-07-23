import { PrismaClient } from "@prisma/client";
import geolib from "geolib"; 

const prisma = new PrismaClient();

export const getFilteredEvents = async (req, res) => {
  const userId = Number(req.query.userId);
  const maxDistance = req.query.distance ? Number(req.query.distance) : null;
  const userLat = Number(req.query.latitude);
  const userLng = Number(req.query.longitude);

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        creatorId: { not: userId }, 
      },
    });

    if (maxDistance && userLat && userLng) {
      const filteredEvents = events.filter((event) => {
        if (!event.latitude || !event.longitude) {
          console.log(`Brak współrzędnych dla wydarzenia ${event.id}`);
          return false;
        }

        const distance = geolib.getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: event.latitude, longitude: event.longitude }
        );

        const distanceInKm = distance / 1000; 
        return distanceInKm <= maxDistance;
      });

      return res.json(filteredEvents);
    } else {
      return res.json(events);
    }
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
