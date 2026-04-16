"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GeneratorForm from "@/components/GeneratorForm";
import ResultCard from "@/components/ResultCard";
import { auth } from "@/lib/firebase";
import { Zap, ArrowRight, Lock } from "lucide-react";

interface Result {
  name: string;
  tagline: string;
}

interface GenerationStats {
  used: number;
  remaining: number;
  allowed: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generationStats, setGenerationStats] = useState<GenerationStats>({ used: 0, remaining: 3, allowed: true });

  const handleGenerate = async (idea: string, industry: string, tone: string) => {
    if (!generationStats.allowed) {
      setError("You've used all your free test generations. Join our waitlist for full access!");
      return;
    }

    setIsLoading(true);
    setResults([]);
    setVisibleCount(0);
    setError("");

    try {
      // Track generation first
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setError("Please sign in to generate names");
        return;
      }

      const trackRes = await fetch("/api/track-generation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const trackData = await trackRes.json();
      if (!trackData.allowed) {
        setGenerationStats(trackData);
        setError(trackData.message || "Generation limit reached");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/generate-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, industry, tone }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg =
          (data?.error && typeof data.error === "object" && data.error.message) ||
          (typeof data?.error === "string" ? data.error : null) ||
          "Failed to generate names";
        throw new Error(msg);
      }

      if (data.items && Array.isArray(data.items)) {
        setResults(data.items);
        setVisibleCount(10);
        setGenerationStats(prev => ({ ...prev, used: prev.used + 1, remaining: prev.remaining - 1 }));
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

  useEffect(() => {
    const fetchGenerationStats = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      try {
        const res = await fetch("/api/track-generation", {
          method: "GET",
          headers: { 
            "Authorization": `Bearer ${token}`
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setGenerationStats(data);
        }
      } catch (error) {
        console.error("Error fetching generation stats:", error);
      }
    };

    fetchGenerationStats();
  }, []);

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
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 sm:p-6">
        {/* Generation Limit Banner */}
        <div className="mb-6">
          <div className={`p-4 rounded-xl border ${
            generationStats.allowed 
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
              : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {generationStats.allowed ? (
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {generationStats.allowed ? 'Free Test Generations' : 'Test Limit Reached'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {generationStats.used} of 3 used
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < generationStats.used 
                        ? 'bg-blue-600 dark:bg-blue-400' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center my-8 sm:my-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Try Brand Generation</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Test our AI with {generationStats.remaining} free generation{generationStats.remaining !== 1 ? 's' : ''} left. 
            Describe your idea and get 20 brand names instantly.
          </p>
        </div>

        {/* Generator Form */}
        <div className="mb-8">
          <GeneratorForm onGenerate={handleGenerate} isLoading={isLoading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 dark:bg-red-900/10 dark:border-red-900/50">
            {error}
          </div>
        )}

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6">Generated Names</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="flex justify-center mt-8 sm:mt-12">
                <button
                  onClick={showMore}
                  className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 px-6 sm:px-8 py-3 rounded-full font-medium hover:border-primary transition-colors hover:text-primary"
                >
                  Show 5 more
                </button>
              </div>
            )}
          </div>
        )}

        {/* Limit Reached CTA */}
        {!generationStats.allowed && (
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-2xl border border-primary/20">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ready for More?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                You've used all your free test generations. Join our waitlist to get notified when we launch with full features!
              </p>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
              >
                Join Waitlist <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
