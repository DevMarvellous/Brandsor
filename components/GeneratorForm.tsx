import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onGenerate: (idea: string, industry: string, tone: string) => void;
  isLoading: boolean;
}

export default function GeneratorForm({ onGenerate, isLoading }: Props) {
  const [idea, setIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("Professional");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;
    onGenerate(idea, industry, tone);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4 relative z-10">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Describe your business idea *</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="A startup that helps people find the best coffee shops nearby..."
          className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary resize-none min-h-[100px]"
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Industry (Optional)</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Technology, Food"
            className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary"
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary appearance-none"
          >
            <option>Professional</option>
            <option>Modern</option>
            <option>Quirky</option>
            <option>Minimalist</option>
            <option>Playful</option>
            <option>Luxurious</option>
            <option>Ambiguous</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={isLoading || !idea.trim()}
          className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {isLoading ? "Generating..." : "Generate Names"}
        </button>
      </div>
    </form>
  );
}
