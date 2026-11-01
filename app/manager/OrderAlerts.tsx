"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Latest = {
  id: string;
  orderNumber: string;
  customerName: string;
  quantity: number;
  total: number;
  createdAt: string;
};

type PushState = "loading" | "unsupported" | "off" | "on" | "denied";

const POLL_MS = 20000;
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const money = (n: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "USD" }).format(n);

function keyToBytes(b64url: string) {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const raw = atob((b64url + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array) {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
}

function beep() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [880, 1175].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.32);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {
    /* o browser pode bloquear som sem interacção prévia */
  }
}

async function postSub(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) throw new Error("Não foi possível registar este aparelho.");
}

export default function OrderAlerts() {
  const router = useRouter();
  const [push, setPush] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Latest | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const lastId = useRef<string | null | undefined>(undefined);

  // --- Estado inicial das notificações push ---
  useEffect(() => {
    (async () => {
      const ok =
        "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!ok || !VAPID_KEY) return setPush("unsupported");
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        if (Notification.permission === "denied") return setPush("denied");
        let sub = await reg.pushManager.getSubscription();
        const wanted = keyToBytes(VAPID_KEY);
        // Subscrição feita com outras chaves: refaz com as actuais.
        if (sub && !sameKey(sub.options?.applicationServerKey, wanted)) {
          await sub.unsubscribe().catch(() => {});
          sub = null;
          if (Notification.permission === "granted") {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: wanted,
            });
          }
        }
        if (sub && Notification.permission === "granted") {
          await postSub(sub).catch(() => {}); // volta a registar se tiver sido limpo
          return setPush("on");
        }
        setPush("off");
      } catch {
        setPush("unsupported");
      }
    })();
  }, []);

  async function enable() {
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPush(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyToBytes(VAPID_KEY),
        }));
      await postSub(sub);
      setPush("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível activar as notificações.");
    }
  }

  async function test() {
    setTestMsg("A enviar teste…");
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const d = await res.json();
      if (!res.ok) return setTestMsg(d.error ?? "Falhou o teste.");
      if (!d.configured)
        return setTestMsg("O servidor não tem as chaves de notificação configuradas na Vercel.");
      if (d.devices === 0)
        return setTestMsg("Este aparelho não está registado. Desactive e active outra vez.");
      const ok = d.results.filter((r: { ok: boolean }) => r.ok).length;
      if (ok > 0) return setTestMsg(`Enviado para ${ok} aparelho(s). Deve chegar dentro de segundos.`);
      const code = d.results[0]?.status;
      if (code === 404 || code === 410)
        return setTestMsg("O registo tinha expirado. Carregue em activar outra vez.");
      if (code === 401 || code === 403)
        return setTestMsg("As chaves não coincidem. Desactive e active outra vez.");
      setTestMsg(`Falhou o envio (código ${code ?? "desconhecido"}).`);
    } catch {
      setTestMsg("Sem ligação ao servidor.");
    }
  }

  async function disable() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe();
      }
      setPush("off");
    } catch {
      setError("Não foi possível desactivar as notificações.");
    }
  }

  // --- Aviso dentro do admin (reserva do push) ---
  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/latest", { cache: "no-store" });
      if (!res.ok) return;
      const { latest } = (await res.json()) as { latest: Latest | null };
      const id = latest?.id ?? null;
      if (lastId.current === undefined) {
        lastId.current = id; // primeira leitura: só memoriza
        return;
      }
      if (id && id !== lastId.current) {
        lastId.current = id;
        setToast(latest);
        beep();
        router.refresh();
      }
    } catch {
      /* sem rede: tenta na próxima */
    }
  }, [router]);

  useEffect(() => {
    check();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [check]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 15000);
    return () => clearTimeout(t);
  }, [toast]);

  const btn =
    "pointer-events-auto rounded-full border border-[#8A7440] bg-[#111111] px-5 py-3 font-body text-[0.65rem] uppercase tracking-[0.3em] text-[#C9A962] transition-colors hover:border-[#C9A962] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C9A962]";

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 top-4 z-50 sm:left-auto sm:right-6 sm:top-6 sm:w-96"
        >
          <button
            type="button"
            onClick={() => {
              router.push(`/manager/${toast.id}`);
              setToast(null);
            }}
            className="w-full rounded-2xl border border-[#C9A962] bg-[#0B0B0B] p-5 text-left shadow-[0_0_40px_rgba(201,169,98,0.25)]"
          >
            <p className="font-display text-lg tracking-[0.1em] text-[#C9A962]">
              CTRL + SHIFT + CANDLE
            </p>
            <p className="mt-3 font-body text-[0.65rem] uppercase tracking-[0.4em] text-[#8A7440]">
              Nova encomenda
            </p>
            <p className="mt-1 font-display text-2xl text-[#C9A962]">{toast.orderNumber}</p>
            <p className="mt-2 font-body text-sm text-[#C9A962]/80">
              {toast.customerName} · {toast.quantity} × · {money(toast.total)}
            </p>
            <p className="mt-3 font-body text-[0.6rem] uppercase tracking-[0.3em] text-[#8A7440]">
              Ver detalhes →
            </p>
          </button>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        {error && (
          <p role="alert" className="max-w-xs rounded-lg bg-[#111111] px-3 py-2 font-body text-xs text-red-400">
            {error}
          </p>
        )}
        {push === "off" && (
          <button type="button" onClick={enable} className={btn}>
            Activar notificações
          </button>
        )}
        {testMsg && (
          <p role="status" className="max-w-xs rounded-lg bg-[#111111] px-3 py-2 font-body text-xs text-[#C9A962]/90">
            {testMsg}
          </p>
        )}
        {push === "on" && (
          <div className="flex gap-2">
            <button type="button" onClick={test} className={btn}>
              Testar
            </button>
            <button type="button" onClick={disable} className={btn} title="Clique para desactivar neste aparelho">
              Notificações activas ✓
            </button>
          </div>
        )}
        {push === "denied" && (
          <p className="max-w-xs rounded-lg bg-[#111111] px-3 py-2 font-body text-xs text-[#C9A962]/80">
            Notificações bloqueadas. Permita-as nas definições do browser para este site.
          </p>
        )}
        {push === "unsupported" && (
          <p className="max-w-xs rounded-lg bg-[#111111] px-3 py-2 font-body text-xs text-[#C9A962]/80">
            Este aparelho não suporta notificações. No iPhone, adicione o site ao ecrã principal.
          </p>
        )}
      </div>
    </>
  );
}
