import { PrismaClient } from "@prisma/client";
import geolib from "geolib";

const prisma = new PrismaClient();

export const getFilteredEvents = async (req, res) => {
  const userId = Number(req.query.userId);
  const maxDistance = req.query.distance ? Number(req.query.distance) : null;
  const eventLat = Number(req.query.latitude);  // Współrzędne wydarzenia
  const eventLng = Number(req.query.longitude); // Współrzędne wydarzenia

  if (!userId) {
    return res.status(400).json({ error: "Brak userId" });
  }

  try {
    // Pobieramy wszystkie wydarzenia, które nie są stworzone przez użytkownika
    const events = await prisma.event.findMany({
      where: {
        creatorId: { not: userId },
      },
    });

    // Jeśli podano odległość i współrzędne wydarzenia
    if (maxDistance && eventLat && eventLng) {
      const filteredEvents = events.filter((event) => {
        // Sprawdzamy, czy wydarzenie ma przypisane współrzędne
        if (!event.latitude || !event.longitude) {
          console.log(`Brak współrzędnych dla wydarzenia ${event.id}`);
          return false; // Pomiń wydarzenie bez współrzędnych
        }

        // Obliczamy odległość między współrzędnymi wydarzenia a lokalizacją (tą, którą użytkownik przekazał)
        const distance = geolib.getDistance(
          { latitude: eventLat, longitude: eventLng },
          { latitude: event.latitude, longitude: event.longitude }
        );

        // Zamieniamy odległość na kilometry
        const distanceInKm = distance / 1000;

        // Sprawdzamy, czy odległość jest mniejsza niż maxDistance
        return distanceInKm <= maxDistance;
      });

      return res.json(filteredEvents);
    } else {
      // Jeśli nie podano odległości, po prostu zwracamy wszystkie wydarzenia
      return res.json(events);
    }
  } catch (err) {
    console.error("❌ Błąd filtrowania wydarzeń:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
};
