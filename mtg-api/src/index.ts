import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '../generated/prisma/client.js';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { createLoaders } from './loaders.js';
import { verifyToken } from './auth.js';
import { PrismaPg } from "@prisma/adapter-pg";



const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      userId = payload?.sub ?? null;
    }

    return {
      prisma,
      loaders: createLoaders(prisma),
      userId,
    };
  },
});

console.log(`🚀 Server ready at ${url}`);