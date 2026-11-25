import { PrismaClient } from "@prisma/client";

const PRISMA_CLIENT_VERSION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaVersion: number | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "stdout", level: "warn" },
            { emit: "event", level: "error" },
          ]
        : [{ emit: "event", level: "error" }],
  });

  client.$on("error", (event) => {
    const message = event.message ?? "";
    // Supabase pooler menutup koneksi idle secara berkala; Prisma otomatis reconnect.
    if (message.includes("kind: Closed")) {
      return;
    }
    console.error("prisma:error", message);
  });

  return client;
}

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaVersion !== PRISMA_CLIENT_VERSION
) {
  void globalForPrisma.prisma.$disconnect().catch(() => {});
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;

