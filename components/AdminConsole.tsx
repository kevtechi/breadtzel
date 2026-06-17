"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoundState } from "@/lib/types";
import { formatBread, formatGrams, shortenAddress } from "@/lib/format";

async function getAdminState(): Promise<RoundState | null> {
  try {
    const res = await fetch("/api/admin/state", { cache: "no-store" });
    return res.ok ? ((await res.json()) as RoundState) : null;
  } catch {
    return null;
  }
}

export function AdminConsole() {
  const router = useRouter();
  const [state, setState] = useState<RoundState | null>(null);
  const [weight, setWeight] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const s = await getAdminState();
    if (s) setState(s);
  }, []);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      const s = await getAdminState();
      if (alive && s) setState(s);
      if (alive) timer = setTimeout(tick, 2000);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  // POST a protected mutation; if the session expired, bounce back to login.
  const post = useCallback(
    async (url: string, body: unknown) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      await refresh();
    },
    [refresh, router],
  );

  const operator = useCallback(
    (action: string, actualWeight?: number) =>
      post("/api/operator", { action, actualWeight }),
    [post],
  );

  const saveName = useCallback(
    async (entryId: string) => {
      const displayName = (drafts[entryId] ?? "").trim();
      if (!displayName) return;
      await post("/api/admin/name", { entryId, displayName });
    },
    [drafts, post],
  );

  const toggleHide = useCallback(
    (entryId: string, hidden: boolean) =>
      post("/api/admin/hide", { entryId, hidden }),
    [post],
  );

  const saveWeight = useCallback(
    async (entryId: string) => {
      const weightGuess = Math.round(Number(weightDrafts[entryId]));
      if (!Number.isFinite(weightGuess) || weightGuess <= 0) return;
      await post("/api/admin/weight", { entryId, weightGuess });
      setWeightDrafts((d) => {
        const next = { ...d };
        delete next[entryId];
        return next;
      });
    },
    [weightDrafts, post],
  );

  const logout = useCallback(async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }, [router]);

  const entries = state?.entries ?? [];
  const visibleCount = entries.filter((e) => !e.hidden).length;
  const parsed = Number(weight);
  const canSpin = state?.phase === "open" && visibleCount > 0;

  return (
    <div className="min-h-screen overflow-auto p-[2rem] text-cream">
      <header className="mb-[1.5rem] flex items-center justify-between">
        <h1 className="font-display text-[2.4rem] uppercase tracking-[0.06em] text-gold-bright">
          🥨 Breadtzel · Admin
        </h1>
        <div className="flex items-center gap-[1rem]">
          <span className="rounded-full border border-cream/25 px-[0.8rem] py-[0.2rem] text-[0.9rem] uppercase tracking-[0.15em] text-cream/60">
            {state ? (state.live ? "live · on-chain" : "demo · mock") : "connecting…"}
          </span>
          <button
            onClick={logout}
            className="rounded border border-cream/25 px-[0.8rem] py-[0.3rem] text-[0.9rem] text-cream/70 hover:text-cream"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Operator controls */}
      <section className="panel mb-[2rem] flex flex-wrap items-end gap-[1.2rem] p-[1.4rem]">
        <div className="text-[1.1rem] text-cream/70">
          Phase: <span className="text-cream">{state?.phase ?? "—"}</span>
          {state?.actualWeight != null && (
            <> · actual {formatGrams(state.actualWeight)}</>
          )}
          {" · "}
          {visibleCount} in play
        </div>
        <div className="flex items-end gap-[0.6rem]">
          <label className="flex flex-col text-[0.85rem] text-cream/60">
            Actual weight (g)
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="73"
              className="tabular mt-[0.2rem] w-[8rem] rounded border border-gold/30 bg-velvet px-[0.6rem] py-[0.4rem] text-[1.2rem] outline-none focus:border-gold"
            />
          </label>
          <button
            disabled={!canSpin || !(parsed > 0)}
            onClick={() => operator("spin", parsed)}
            className="rounded bg-gold px-[1.2rem] py-[0.5rem] font-bold uppercase text-velvet-deep transition hover:bg-gold-bright disabled:opacity-30"
          >
            Spin
          </button>
          <button
            disabled={state?.phase !== "spinning"}
            onClick={() => operator("reveal")}
            className="rounded border border-gold/40 px-[1rem] py-[0.5rem] text-cream/85 transition hover:bg-gold/10 disabled:opacity-30"
          >
            Reveal now
          </button>
          <button
            onClick={() => operator("reset")}
            className="rounded border border-gold/40 px-[1rem] py-[0.5rem] text-cream/85 transition hover:bg-gold/10"
          >
            New round
          </button>
        </div>
      </section>

      {/* Per-guess moderation: name the sender, hide a guess */}
      <section className="panel p-[1.4rem]">
        <h2 className="mb-[1rem] font-display text-[1.4rem] uppercase tracking-[0.1em] text-gold-bright">
          Guesses — annotate &amp; moderate
        </h2>
        <table className="w-full border-collapse text-[1.05rem]">
          <thead>
            <tr className="text-left text-[0.85rem] uppercase tracking-[0.12em] text-cream/45">
              <th className="py-[0.5rem]">Guess</th>
              <th>BREAD</th>
              <th>Transaction</th>
              <th>Show as (name this guess)</th>
              <th className="text-right">On screen</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-t border-gold/10"
                style={{ opacity: e.hidden ? 0.45 : 1 }}
              >
                <td className="py-[0.6rem]">
                  <div className="flex items-center gap-[0.4rem]">
                    <input
                      type="number"
                      value={weightDrafts[e.id] ?? String(e.weightGuess)}
                      onChange={(ev) =>
                        setWeightDrafts((d) => ({ ...d, [e.id]: ev.target.value }))
                      }
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") void saveWeight(e.id);
                      }}
                      className="tabular w-[5rem] rounded border border-gold/30 bg-velvet px-[0.5rem] py-[0.3rem] text-[1.3rem] font-bold text-gold-bright outline-none focus:border-gold"
                    />
                    <span className="text-[0.95rem] text-cream/50">g</span>
                    {weightDrafts[e.id] != null &&
                      Math.round(Number(weightDrafts[e.id])) !== e.weightGuess && (
                        <button
                          onClick={() => saveWeight(e.id)}
                          className="rounded bg-gold/90 px-[0.7rem] py-[0.3rem] text-[0.85rem] font-bold uppercase text-velvet-deep hover:bg-gold-bright"
                        >
                          Set
                        </button>
                      )}
                    {e.hidden && (
                      <span className="ml-[0.2rem] text-[0.8rem] font-normal uppercase tracking-[0.1em] text-berry">
                        hidden
                      </span>
                    )}
                  </div>
                </td>
                <td className="tabular text-mint">{formatBread(e.amountBread)}</td>
                <td className="tabular text-cream/70">
                  {e.txHash ? (
                    <a
                      href={`https://gnosisscan.io/tx/${e.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      title={`${e.txHash} · from ${e.address}`}
                      className="text-cream/70 underline decoration-gold/30 underline-offset-2 hover:text-cream"
                    >
                      {shortenAddress(e.txHash)}
                    </a>
                  ) : (
                    <span title={e.address}>{shortenAddress(e.address)}</span>
                  )}
                </td>
                <td className="flex items-center gap-[0.5rem] py-[0.4rem]">
                  <input
                    value={drafts[e.id] ?? ""}
                    onChange={(ev) =>
                      setDrafts((d) => ({ ...d, [e.id]: ev.target.value }))
                    }
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") void saveName(e.id);
                    }}
                    placeholder={e.displayName}
                    className="w-[12rem] rounded border border-gold/30 bg-velvet px-[0.6rem] py-[0.3rem] outline-none focus:border-gold"
                  />
                  <button
                    onClick={() => saveName(e.id)}
                    className="rounded bg-gold/90 px-[0.8rem] py-[0.3rem] text-[0.9rem] font-bold uppercase text-velvet-deep hover:bg-gold-bright"
                  >
                    Save
                  </button>
                </td>
                <td className="text-right">
                  <button
                    onClick={() => toggleHide(e.id, !e.hidden)}
                    className="rounded border border-gold/40 px-[0.9rem] py-[0.3rem] text-[0.9rem] text-cream/85 transition hover:bg-gold/10"
                  >
                    {e.hidden ? "Show" : "Hide"}
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-[1rem] text-cream/40">
                  No guesses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
