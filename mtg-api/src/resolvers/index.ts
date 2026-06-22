import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Loaders } from '../loaders.js';
import { signToken, hashPassword, verifyPassword } from '../auth.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Context = {
  prisma: PrismaClient;
  loaders: Loaders;
  userId: string | null;
};

export const resolvers = {
  Query: {
    card: (_: any, { uuid }: { uuid: string }, { prisma }: Context) =>
      prisma.cards.findUnique({ where: { uuid } }),

    cards: (_: any, { filter, limit = 20, offset = 0 }: any, { prisma }: Context) => {
      const where: any = {};

      if (filter?.name) {
        where.name = { contains: filter.name, mode: 'insensitive' };
      }
      if (filter?.colors?.length) {
        const must = filter.colors
          .filter((c: string) => !c.startsWith('-'))
          .map((c: string) => c.toUpperCase());

        const mustNot = filter.colors
          .filter((c: string) => c.startsWith('-'))
          .map((c: string) => c.slice(1).toUpperCase());

        if (must.length) {
          where.colors_arr = { hasEvery: must };
        }
        if (mustNot.length) {
          where.AND = mustNot.map((c: string) => ({
            NOT: { colors_arr: { has: c } }
          }));
        }
      }
      if (filter?.colorIdentity?.length) {
        where.colorIdentity_arr = { hasEvery: filter.colorIdentity };
      }
      if (filter?.manaValue !== undefined) {
        where.manaValue = filter.manaValue;
      }
      if (filter?.manaValueLte !== undefined) {
        where.manaValue = { ...where.manaValue, lte: filter.manaValueLte };
      }
      if (filter?.manaValueGte !== undefined) {
        where.manaValue = { ...where.manaValue, gte: filter.manaValueGte };
      }
      if (filter?.rarity) {
        where.rarity = filter.rarity;
      }
      if (filter?.setCode) {
        where.setCode = filter.setCode;
      }
      if (filter?.type) {
        where.type = { contains: filter.type, mode: 'insensitive' };
      }
      if (filter?.text) {
        where.text = { contains: filter.text, mode: 'insensitive' };
      }

      return prisma.cards.findMany({ where, take: limit, skip: offset });
    },

    set: (_: any, { code }: { code: string }, { prisma }: Context) =>
      prisma.sets.findUnique({ where: { code } }),

    sets: (_: any, { filter, limit = 50, offset = 0 }: any, { prisma }: Context) => {
      const where: any = {};

      if (filter?.name) {
        where.name = { contains: filter.name, mode: 'insensitive' };
      }
      if (filter?.code) {
        where.code = { equals: filter.code, mode: 'insensitive' };
      }
      if (filter?.type) {
        where.type = { equals: filter.type, mode: 'insensitive' };
      }
      if (filter?.releasedAfter) {
        where.releaseDate = { ...where.releaseDate, gte: filter.releasedAfter };
      }
      if (filter?.releasedBefore) {
        where.releaseDate = { ...where.releaseDate, lte: filter.releasedBefore };
      }
      if (filter?.excludeOnlineOnly) {
        where.isOnlineOnly = { not: true };
      }
      if (filter?.excludePaperOnly) {
        where.isPaperOnly = { not: true };
      }
      if (filter?.excludePromos) {
        where.type = { ...where.type, not: 'promo' };
      }
      if (filter?.minTotalSetSize !== undefined) {
        where.totalSetSize = { ...where.totalSetSize, gte: filter.minTotalSetSize };
      }
      if (filter?.maxTotalSetSize !== undefined) {
        where.totalSetSize = { ...where.totalSetSize, lte: filter.maxTotalSetSize };
      }

      return prisma.sets.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { releaseDate: 'desc' },
      });
    },

    deck: (_: any, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');
      return prisma.deck.findFirst({ where: { id, userUuid: userId } });
    },

    decks: (_: any, __: any, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');
      return prisma.deck.findMany({
        where: { userUuid: userId },
        orderBy: { createdAt: 'desc' },
      });
    },

    me: (_: any, __: any, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');
      return prisma.user.findUnique({ where: { uuid: userId } });
    },

    user: async (_: any, { username }: any, { prisma }: Context) => {
      const result = await prisma.user.findFirst({
        where: { username: { contains: username, mode: 'insensitive' } },
      });
      console.log(result);
      return result;
    },

    collection: (_: any, __: any, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');
      return prisma.collection.findMany({
        where: { userUuid: userId },
      });
    },
  },

  Card: {
    colors: (parent: any) =>
      parent.colors_arr ?? parent.colors?.split(',').map((s: string) => s.trim()) ?? [],

    colorIdentity: (parent: any) =>
      parent.colorIdentity_arr ?? parent.colorIdentity?.split(',').map((s: string) => s.trim()) ?? [],

    set: (parent: any, _: any, { loaders }: Context) =>
      parent.setCode ? loaders.sets.load(parent.setCode) : null,

    legalities: (parent: any, _: any, { loaders }: Context) =>
      loaders.cardLegalities.load(parent.uuid),

    identifiers: (parent: any, _: any, { loaders }: Context) =>
      loaders.cardIdentifiers.load(parent.uuid),

    rulings: (parent: any, _: any, { loaders }: Context) =>
      loaders.cardRulings.load(parent.uuid),

    purchaseUrls: (parent: any, _: any, { loaders }: Context) =>
      loaders.cardPurchaseUrls.load(parent.uuid),

    imageUrl: async (parent: any, _: any, { loaders }: Context) => {
      const identifiers = await loaders.cardIdentifiers.load(parent.uuid);
      if (!identifiers?.scryfallId) return null;
      const id = identifiers.scryfallId;
      return `https://cards.scryfall.io/normal/front/${id[0]}/${id[1]}/${id}.jpg`;
    },

    imageUrlCrop: async (parent: any, _: any, { loaders }: Context) => {
      const identifiers = await loaders.cardIdentifiers.load(parent.uuid);
      if (!identifiers?.scryfallId) return null;
      const id = identifiers.scryfallId;
      return `https://cards.scryfall.io/art_crop/front/${id[0]}/${id[1]}/${id}.jpg`;
    },
  },

  Deck: {
    cards: (parent: any, _: any, { prisma }: Context) =>
      prisma.deckCard.findMany({ where: { deckId: parent.id } }),
    owner: (parent: any, _: any, { prisma }: Context) =>
      prisma.user.findUnique({ where: { uuid: parent.userUuid } }),
  },

  DeckCard: {
    card: (parent: any, _: any, { prisma }: Context) =>
      prisma.cards.findUnique({ where: { uuid: parent.cardUuid } }),
  },

  CollectionEntry: {
    card: (parent: any, _: any, { prisma }: Context) =>
      prisma.cards.findUnique({ where: { uuid: parent.cardUuid } }),
  },

  Mutation: {
    register: async (_: any, { username, email, password, displayName }: any, { prisma }: Context) => {
      const existing = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      });
      if (existing) throw new Error('Username or email already taken');

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: { username, email, passwordHash, displayName: displayName ?? username },
      });

      const token = signToken(user.uuid, user.username);
      return { token, user };
    },

    login: async (_: any, { username, password }: any, { prisma }: Context) => {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) throw new Error('Invalid credentials');

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) throw new Error('Invalid credentials');

      const token = signToken(user.uuid, user.username);
      return { token, user };
    },

    createDeck: (_: any, { name, format }: any, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');
      return prisma.deck.create({ data: { name, format, userUuid: userId } });
    },

    addCardToDeck: (_: any, { deckId, cardUuid, quantity = 1, isSideboard = false, isCommander = false }: any, { prisma }: Context) =>
      prisma.deckCard.create({ data: { deckId, cardUuid, quantity, isSideboard, isCommander } }),

    removeCardFromDeck: async (_: any, { deckCardId }: any, { prisma }: Context) => {
      await prisma.deckCard.delete({ where: { id: deckCardId } });
      return true;
    },

    addToCollection: (_: any, { cardUuid, quantity = 1, foil = false }: any, { prisma, userId }: Context) => {
      if (!userId) throw new Error('Not authenticated');
      return prisma.collection.create({ data: { cardUuid, quantity, foil, userUuid: userId } });
    },

    removeFromCollection: async (_: any, { id }: any, { prisma }: Context) => {
      await prisma.collection.delete({ where: { id } });
      return true;
    },

    setCommander: (_: any, { deckCardId, isCommander }: any, { prisma }: Context) =>
      prisma.deckCard.update({ where: { id: deckCardId }, data: { isCommander } }),

    updateDeckCardQuantity: (_: any, { deckCardId, quantity }: any, { prisma }: Context) =>
      prisma.deckCard.update({ where: { id: deckCardId }, data: { quantity } }),
  },
};