import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { UsersClient } from "./client";

export const dynamic = "force-dynamic";

export default async function SettingsUsersPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <UsersClient
      users={JSON.parse(JSON.stringify(users))}
      currentUserId={session.userId}
    />
  );
}

