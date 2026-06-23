"use client";

import { useEffect, useRef } from "react";

import { useTranslation } from "@/hooks/use-translation";
import { Spinner } from "@/components/ui/spinner";
import { formatINRDecimal } from "@/lib/format";

interface PaymentModalProps {
  /** Total payable in whole rupees. */
  total: number;
  onClose: () => void;
  onConfirm: () => void;
  processing: boolean;
}

export function PaymentModal({ total, onClose, onConfirm, processing }: PaymentModalProps) {
  const { t } = useTranslation();
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Honor the dialog's aria-modal semantics for keyboard users: focus the
  // primary action on open and allow Escape to dismiss (unless mid-payment).
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !processing) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [processing, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !processing) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-xl font-bold text-slate-900">{t("wiz.pay.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 transition hover:text-slate-600 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-slate-500">{t("wiz.pay.subtitle")}</p>

        <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t("wiz.pay.order_label")}</span>
            <span className="font-semibold text-slate-900">{t("wiz.pay.order_value")}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t("wiz.pay.total_label")}</span>
            <span className="text-lg font-bold text-indigo-600">{formatINRDecimal(total)}</span>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2 text-sm font-medium text-green-600">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 1.5 3 4.3v4.4c0 4 2.8 7.6 7 8.8 4.2-1.2 7-4.9 7-8.8V4.3L10 1.5Zm3.5 6.2-4.2 5a.8.8 0 0 1-1.2 0L5.9 10.4a.8.8 0 1 1 1.2-1l1.6 1.9 3.6-4.3a.8.8 0 0 1 1.2 1Z" clipRule="evenodd" />
          </svg>
          {t("wiz.pay.dummy_note")}
        </p>

        <button
          ref={confirmRef}
          type="button"
          onClick={onConfirm}
          disabled={processing}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing && <Spinner />}
          {processing
            ? t("wiz.pay.processing")
            : t("wiz.pay.simulate", { amount: `₹${total}` })}
        </button>
      </div>
    </div>
  );
}
