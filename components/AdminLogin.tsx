"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || code.length === 0) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setError(true);
        setCode("");
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-[2rem] text-cream">
      <div className="panel flex w-[26rem] flex-col items-center gap-[1.2rem] p-[2.2rem]">
        <h1 className="font-display text-[2rem] uppercase tracking-[0.08em] text-gold-bright">
          🥨 Admin
        </h1>
        <p className="text-center text-[1rem] text-cream/60">
          Enter the 6-digit operator code.
        </p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
          placeholder="••••••"
          className="tabular w-full rounded-[0.6rem] border border-gold/30 bg-velvet px-[1rem] py-[0.7rem] text-center text-[2rem] tracking-[0.5em] outline-none focus:border-gold"
        />
        {error && (
          <p className="text-[0.95rem] text-berry">Incorrect code — try again.</p>
        )}
        <button
          onClick={submit}
          disabled={busy || code.length === 0}
          className="w-full rounded-[0.6rem] bg-gold py-[0.7rem] font-bold uppercase tracking-[0.1em] text-velvet-deep transition hover:bg-gold-bright disabled:opacity-30"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}
