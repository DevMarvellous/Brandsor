"use client";

import { useState } from "react";

interface Step {
  title: string;
  message: string;
  confirmLabel: string;
}

interface Props {
  title: string;
  message: string;
  /** Primary confirm button label. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions. */
  danger?: boolean;
  /** Disable buttons + show a working state on the confirm button. */
  loading?: boolean;
  /** If set, the first confirm advances to this second "are you sure?" screen,
   *  and only its confirm fires onConfirm — a two-step guard for deletes. */
  secondStep?: Step;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Generic confirm dialog, styled like UnsavedChangesModal. Single-step by default
 * (used for go-public / change-link); pass `secondStep` for a two-step delete guard.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  secondStep,
  onConfirm,
  onCancel,
}: Props) {
  const [advanced, setAdvanced] = useState(false);

  const current: Step =
    advanced && secondStep
      ? secondStep
      : { title, message, confirmLabel };

  const handlePrimary = () => {
    if (secondStep && !advanced) {
      setAdvanced(true);
      return;
    }
    onConfirm();
  };

  const confirmClasses = danger
    ? "bg-red-500 text-white hover:bg-red-600"
    : "bg-primary text-black hover:scale-[1.02]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-gray-700 p-6 shadow-2xl">
        <h2 className="text-lg font-bold mb-1">{current.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{current.message}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 font-medium hover:border-primary transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold active:scale-95 transition-all disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? "Working…" : current.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
