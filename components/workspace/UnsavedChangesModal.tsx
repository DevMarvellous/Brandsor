"use client";

import { useState } from "react";

interface Props {
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/** Two-step "leave without saving" confirm, replacing a plain window.confirm. */
export default function UnsavedChangesModal({ saving, onSave, onDiscard, onCancel }: Props) {
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-gray-700 p-6 shadow-2xl">
        {!confirmingDiscard ? (
          <>
            <h2 className="text-lg font-bold mb-1">You have unsaved changes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Save your edits before leaving, or leave without saving.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="flex-1 bg-primary text-black px-4 py-2.5 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDiscard(true)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 font-medium hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-60"
              >
                Leave without saving
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-1">Are you sure?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Your unsaved changes will be lost.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 font-medium hover:border-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onDiscard}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-red-600 active:scale-95 transition-all"
              >
                Yes, leave
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
