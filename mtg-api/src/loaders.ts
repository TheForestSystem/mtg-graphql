import DataLoader from 'dataloader';
import { PrismaClient } from '../generated/prisma/client.js';

export function createLoaders(prisma: PrismaClient) {
  return {
    cardIdentifiers: new DataLoader(async (uuids: readonly string[]) => {
      const results = await prisma.cardIdentifiers.findMany({
        where: { uuid: { in: [...uuids] } },
      });
      const map = new Map(results.map(r => [r.uuid, r]));
      return uuids.map(uuid => map.get(uuid) ?? null);
    }),

    cardLegalities: new DataLoader(async (uuids: readonly string[]) => {
      const results = await prisma.cardLegalities.findMany({
        where: { uuid: { in: [...uuids] } },
      });
      const map = new Map(results.map(r => [r.uuid, r]));
      return uuids.map(uuid => map.get(uuid) ?? null);
    }),

    cardRulings: new DataLoader(async (uuids: readonly string[]) => {
      const results = await prisma.cardRulings.findMany({
        where: { uuid: { in: [...uuids] } },
      });
      // Group by uuid since one card can have many rulings
      const map = new Map<string, typeof results>();
      for (const r of results) {
        if (!r.uuid) continue;
        if (!map.has(r.uuid)) map.set(r.uuid, []);
        map.get(r.uuid)!.push(r);
      }
      return uuids.map(uuid => map.get(uuid) ?? []);
    }),

    cardPurchaseUrls: new DataLoader(async (uuids: readonly string[]) => {
      const results = await prisma.cardPurchaseUrls.findMany({
        where: { uuid: { in: [...uuids] } },
      });
      const map = new Map(results.map(r => [r.uuid, r]));
      return uuids.map(uuid => map.get(uuid) ?? null);
    }),

    sets: new DataLoader(async (codes: readonly string[]) => {
      const results = await prisma.sets.findMany({
        where: { code: { in: [...codes] } },
      });
      const map = new Map(results.map(r => [r.code, r]));
      return codes.map(code => map.get(code) ?? null);
    }),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;