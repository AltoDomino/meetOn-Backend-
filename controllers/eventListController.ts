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

    if (maxDistance && !isNaN(userLat) && !isNaN(userLng)) {
      const filteredEvents = events.filter((event) => {
        if (
          event.latitude == null ||
          event.longitude == null ||
          isNaN(Number(event.latitude)) ||
          isNaN(Number(event.longitude))
        ) {
          console.warn(`⚠️ Brak lub niepoprawne współrzędne dla eventu ${event.id}`);
          return false;
        }

        const distance = getDistance(
          {
            latitude: Number(event.latitude),
            longitude: Number(event.longitude),
          },
          {
            latitude: userLat,
            longitude: userLng,
          }
        );

        console.log(`📏 Dystans do eventu ${event.id}: ${distance}m`);

        return distance <= maxDistance * 1000;
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
