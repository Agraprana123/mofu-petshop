import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
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
    if (
      message.includes("Error in PostgreSQL connection") &&
      message.includes("kind: Closed")
    ) {
      return;
    }
    console.error("prisma:error", message);
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

