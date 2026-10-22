import { prisma } from "@/lib/db";

/** Verdadeiro enquanto ainda não existe nenhum utilizador (primeira configuração). */
export async function needsSetup(): Promise<boolean> {
  return (await prisma.user.count()) === 0;
}
