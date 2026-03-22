"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GeneratorForm from "@/components/GeneratorForm";
import ResultCard from "@/components/ResultCard";
import { auth } from "@/lib/firebase";

interface Result {
  name: string;
  tagline: string;
}

export default function DashboardPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (idea: string, industry: string, tone: string) => {
    setIsLoading(true);
    setResults([]);
    setVisibleCount(0);
    setError("");

    try {
      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, industry, tone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to generate names");
      }

      if (data.items && Array.isArray(data.items)) {
        setResults(data.items);
        setVisibleCount(10);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const showMore = () => {
    setVisibleCount((prev) => Math.min(prev + 5, results.length));
  };

  const handleSave = async (name: string, tagline: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.error("User not authenticated");
        return;
      }
      
      const res = await fetch("/api/save-name", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name, tagline }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to save name");
      }
      // Optionally show a toast here
    } catch (error) {
      console.error("Error saving name:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-6">
        <div className="text-center my-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Start Generating.</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Give us a brief description of your idea to get 20 stunning brand names.
          </p>
        </div>

        <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 dark:bg-red-900/10 dark:border-red-900/50">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Generated Names</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.slice(0, visibleCount).map((res, index) => (
                <ResultCard
                  key={index}
                  name={res.name}
                  tagline={res.tagline}
                  onSave={handleSave}
                />
              ))}
            </div>
            
            {visibleCount < results.length && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={showMore}
                  className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 px-8 py-3 rounded-full font-medium hover:border-primary transition-colors hover:text-primary"
                >
                  Show 5 more
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
