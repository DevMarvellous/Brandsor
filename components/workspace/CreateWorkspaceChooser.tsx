"use client";

import { useState } from "react";
import { Sparkles, Edit3, ChevronLeft } from "lucide-react";
import CreateBrandDirect from "@/components/CreateBrandDirect";
import GeneratorForm from "@/components/GeneratorForm";

interface Props {
  onCreateBrand: (name: string, tagline: string) => Promise<void> | void;
  onGenerate?: (idea: string, industry: string, tone: string) => void;
  isLoading?: boolean;
}

type Mode = "choose" | "manual" | "ai";

export default function CreateWorkspaceChooser({
  onCreateBrand,
  onGenerate,
  isLoading = false,
}: Props) {
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "choose") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => setMode("manual")}
          className="group relative p-6 rounded-2xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] hover:border-primary hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] group-hover:bg-primary/10 transition-colors">
              <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-black dark:text-white mb-1">
                I already have a name
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a workspace with your chosen name
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setMode("ai")}
          className="group relative p-6 rounded-2xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] hover:border-primary hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] group-hover:bg-primary/10 transition-colors">
              <Sparkles className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-black dark:text-white mb-1">
                Generate with AI
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Get brand name suggestions and AI-filled workspace
              </p>
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setMode("choose")}
        className="flex items-center gap-2 mb-6 text-sm text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      {mode === "manual" && <CreateBrandDirect onCreate={onCreateBrand} />}
      {mode === "ai" && onGenerate && (
        <GeneratorForm onGenerate={onGenerate} isLoading={isLoading} />
      )}
    </div>
  );
}
