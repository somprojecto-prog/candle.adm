import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UserAdmin from "./UserAdmin";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-gold sm:text-4xl">Utilizadores</h1>
      <p className="mt-3 font-body text-sm leading-relaxed text-gold/70">
        Administradores gerem utilizadores e encomendas. Gestores só gerem encomendas.
      </p>
      <UserAdmin users={users} currentId={session?.uid ?? ""} />
    </div>
  );
}
