// src/services/ratingService.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Dist = Record<1 | 2 | 3 | 4 | 5, number>;
const emptyDist = (): Dist => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

const round1 = (n: number) => Math.round((n + Number.EPSILON) * 10) / 10;

export type RatingInput = {
  rateeId: number;
  stars: number; // 1-5
  tags: string[];
};

export async function saveRatingsForEvent(params: {
  eventId: number;
  raterId: number;
  ratings: RatingInput[];
}) {
  const { eventId, raterId, ratings } = params;

  // upsert bo masz @@unique([eventId, raterId, rateeId])
  await prisma.userRating.createMany({
    data: ratings.map((r) => ({
      eventId,
      raterId,
      rateeId: r.rateeId,
      stars: r.stars,
      tags: r.tags ?? [],
    })),
    skipDuplicates: true,
  });

  return { success: true as const };
}

export async function getEventRatingsStats(params: {
  eventId: number;
  onlyThisEvent?: boolean; // jeśli true => liczymy staty tylko z tego eventu
}) {
  const { eventId, onlyThisEvent = false } = params;

  // ⬇️ DOPASUJ DO SWOJEJ TABELI UCZESTNIKÓW
  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    select: { userId: true },
  });

  const userIds = participants.map((p) => p.userId);
  if (userIds.length === 0) return { users: [] as any[] };

  const ratings = await prisma.userRating.findMany({
    where: {
      rateeId: { in: userIds },
      ...(onlyThisEvent ? { eventId } : {}),
    },
    select: { rateeId: true, stars: true, tags: true },
  });

  type Agg = { sum: number; count: number; dist: Dist; tagCounts: Map<string, number> };
  const byUser = new Map<number, Agg>();

  const ensure = (uid: number) => {
    if (!byUser.has(uid)) {
      byUser.set(uid, { sum: 0, count: 0, dist: emptyDist(), tagCounts: new Map() });
    }
    return byUser.get(uid)!;
  };

  for (const r of ratings) {
    const agg = ensure(r.rateeId);

    const s = r.stars as 1 | 2 | 3 | 4 | 5;
    if (s >= 1 && s <= 5) {
      agg.dist[s] += 1;
      agg.sum += s;
      agg.count += 1;
    }

    for (const t of r.tags ?? []) {
      const key = String(t).trim();
      if (!key) continue;
      agg.tagCounts.set(key, (agg.tagCounts.get(key) ?? 0) + 1);
    }
  }

  const users = userIds.map((uid) => {
    const agg = byUser.get(uid);

    if (!agg) {
      return { userId: uid, stars: { average: 0, count: 0, distribution: emptyDist() }, tags: [] };
    }

    const tags = Array.from(agg.tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    return {
      userId: uid,
      stars: { average: agg.count ? round1(agg.sum / agg.count) : 0, count: agg.count, distribution: agg.dist },
      tags,
    };
  });

  return { users };
}
