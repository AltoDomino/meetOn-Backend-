// src/services/ratingService.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type SingleRatingInput = {
  rateeId: number;
  stars: number;
  tags: string[];
};

type SaveRatingsInput = {
  eventId: number;
  raterId: number;
  ratings: SingleRatingInput[];
};

export async function saveRatingsForEvent(input: SaveRatingsInput) {
  const { eventId, raterId, ratings } = input;

  if (ratings.length === 0) return;

  // jedna transakcja, żeby wszystko zapisało się albo nic
  await prisma.$transaction(
    ratings.map((r) =>
      prisma.userRating.upsert({
        where: {
          eventId_raterId_rateeId: {
            eventId,
            raterId,
            rateeId: r.rateeId,
          },
        },
        update: {
          stars: r.stars,
          tags: r.tags,
        },
        create: {
          eventId,
          raterId,
          rateeId: r.rateeId,
          stars: r.stars,
          tags: r.tags,
        },
      })
    )
  );
}
