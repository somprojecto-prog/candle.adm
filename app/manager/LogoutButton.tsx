"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnGhost } from "@/lib/ui";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} disabled={busy} className={`${btnGhost} !px-4 !py-2`}>
      Sair
    </button>
  );
}
