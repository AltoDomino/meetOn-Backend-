import { PrismaClient } from "@prisma/client";
import { getDistance } from "geolib";

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
    console.log("🔍 Parametry zapytania:", { userId, maxDistance, userLat, userLng });

    const events = await prisma.event.findMany({
      where: {
        creatorId: { not: userId },
      },
      include: {
        creator: {
          select: {
            id: true,
            userName: true,
          },
        },
      },
    });

    if (maxDistance && userLat && userLng) {
      const filteredEvents = events.filter((event) => {
        if (!event.latitude || !event.longitude) {
          console.log(`⚠️ Brak współrzędnych dla wydarzenia ${event.id}`);
          return false;
        }

        const distance = getDistance(
          { latitude: userLat, longitude: userLng },
          { latitude: event.latitude, longitude: event.longitude }
        );

        return distance / 1000 <= maxDistance;
      });

      return res.json(filteredEvents);
    } else {
      return res.json(events);
    }
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera", details: err.message });
  }
};
