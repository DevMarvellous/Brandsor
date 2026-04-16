"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResultCard from "@/components/ResultCard";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

interface SavedName {
  id: string;
  name: string;
  tagline: string;
}

export default function SavedNamesPage() {
  const [savedNames, setSavedNames] = useState<SavedName[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const fetchSaved = async (currentUser: NonNullable<typeof auth.currentUser>) => {
      try {
        const token = await currentUser.getIdToken();
        if (!token) {
          setSavedNames([]);
          return;
        }
        const res = await fetch("/api/get-saved", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSavedNames(data.savedNames || []);
        }
      } catch (error) {
        console.error("Error fetching saved names:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchSaved(currentUser);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/delete-name?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setSavedNames(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting name:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Saved Names</h1>

        {!user && !loading && (
          <div className="bg-gray-50 dark:bg-[#1a1a1a] p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold mb-2">Please login to view saved names</h2>
            <p className="text-gray-500">Your saved ideas are securely stored and synced across your devices.</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {user && !loading && savedNames.length === 0 && (
          <div className="bg-gray-50 dark:bg-[#1a1a1a] p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-800">
            <p className="text-gray-500 text-lg">You haven't saved any brand names yet.</p>
          </div>
        )}

        {user && savedNames.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedNames.map((item) => (
              <ResultCard
                key={item.id}
                name={item.name}
                tagline={item.tagline}
                isSavedInitial={true}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
