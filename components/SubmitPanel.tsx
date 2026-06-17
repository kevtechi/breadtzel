"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { PaymentInfo } from "@/lib/types";

export function SubmitPanel({ payment }: { payment: PaymentInfo }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!payment.receivingAddress) return;
    let alive = true;
    // Plain address QR — MetaMask scans it and prefills the recipient; the
    // sender chooses BREAD + amount themselves.
    QRCode.toDataURL(payment.receivingAddress, {
      margin: 1,
      width: 600,
      errorCorrectionLevel: "M",
      color: { dark: "#1b201aff", light: "#f6f3ebff" },
    })
      .then((url) => alive && setQr(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [payment.receivingAddress]);

  return (
    <section className="panel flex items-center gap-[1.8rem] p-[1.6rem]">
      <div className="shrink-0 rounded-[0.9rem] bg-cream p-[0.6rem]">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr}
            alt={`Scan to send ${payment.tokenSymbol} on ${payment.chainName}`}
            className="h-[11rem] w-[11rem]"
          />
        ) : (
          <div className="flex h-[11rem] w-[11rem] items-center justify-center rounded text-center text-[5rem]">
            🥨
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[0.6rem]">
        <h2 className="font-display text-[1.7rem] uppercase tracking-[0.1em] text-gold-bright">
          Play now
        </h2>
        <p className="text-[1.3rem] leading-snug text-cream/90">
          Send <strong className="text-mint">{payment.tokenSymbol}</strong> on{" "}
          {payment.chainName}. The amount <em>is</em> your guess:
        </p>
        <p className="tabular rounded-[0.6rem] bg-velvet-deep/60 px-[1rem] py-[0.6rem] text-[1.5rem] text-cream">
          <span className="text-gold-bright">7.5 {payment.tokenSymbol}</span> ={" "}
          <span className="text-gold-bright">75&nbsp;g</span>
          <span className="text-cream/55"> · 1 {payment.tokenSymbol} = 10&nbsp;g</span>
        </p>
        {payment.receivingAddress ? (
          <p className="tabular break-all text-[1.05rem] text-cream/55">
            {payment.receivingAddress}
          </p>
        ) : (
          <p className="text-[1.05rem] text-cream/45">
            Demo mode — set a receiving address to open live entries.
          </p>
        )}
      </div>
    </section>
  );
}
