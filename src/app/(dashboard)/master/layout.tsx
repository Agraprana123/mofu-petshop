import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
