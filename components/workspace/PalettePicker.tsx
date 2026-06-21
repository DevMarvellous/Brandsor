"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Plus, X, Check } from "lucide-react";
import type { PaletteColor } from "@/lib/brands";

interface Props {
  palette: PaletteColor[];
  onChange: (palette: PaletteColor[]) => void;
}

const MAX_COLORS = 12;

export default function PalettePicker({ palette, onChange }: Props) {
  // Index of the color currently being edited (its editor renders BELOW the swatch
  // row, not as a per-swatch popover, so it can never clip off-screen on mobile).
  const [editing, setEditing] = useState<number | null>(null);

  const update = (i: number, patch: Partial<PaletteColor>) => {
    onChange(palette.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const remove = (i: number) => {
    onChange(palette.filter((_, idx) => idx !== i));
    setEditing(null);
  };
  const add = () => {
    if (palette.length >= MAX_COLORS) return;
    onChange([...palette, { hex: "#F2A900" }]);
    setEditing(palette.length);
  };

  const active = editing !== null ? palette[editing] : null;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {palette.map((color, i) => (
          <div key={i} className="relative">
            <button
              type="button"
              onClick={() => setEditing(editing === i ? null : i)}
              aria-label={`Edit color ${color.hex}`}
              className={`w-14 h-14 rounded-xl border shadow-sm transition-transform hover:scale-105 active:scale-95 ${
                editing === i
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.hex}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-2 -right-2 bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-full p-0.5 shadow-sm hover:text-red-500"
              title="Remove color"
              aria-label="Remove color"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {palette.length < MAX_COLORS && (
          <button
            type="button"
            onClick={add}
            className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
            title="Add color"
            aria-label="Add color"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {palette.length === 0 && (
        <p className="text-sm text-gray-400 mt-3">No colors yet — add your brand palette.</p>
      )}

      {/* Editor panel — below the row, so it stays on-screen at any width. */}
      {active && editing !== null && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-[#151515] border border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-start">
          <HexColorPicker
            color={active.hex}
            onChange={(hex) => update(editing, { hex })}
          />
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <label className="text-xs text-gray-400">Hex</label>
            <input
              value={active.hex}
              aria-label="Hex value"
              onChange={(e) => update(editing, { hex: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent uppercase"
            />
            <label className="text-xs text-gray-400 mt-1">Label (optional)</label>
            <input
              value={active.name ?? ""}
              aria-label="Color label"
              onChange={(e) => update(editing, { name: e.target.value })}
              placeholder="e.g. Primary"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
            />
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="mt-2 self-start inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Check className="w-4 h-4" /> Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
