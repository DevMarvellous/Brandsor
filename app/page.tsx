"use client";

import Link from "next/link";
import { Sparkles, LogIn, UserPlus } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (user) {
      router.push("/dashboard");
    } else {
      const res = await signInWithGoogle();
      if (res) {
        router.push("/dashboard");
      }
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-white dark:bg-[#0f0f0f]">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full text-center flex flex-col items-center mt-12 sm:mt-0 relative z-10">
        
        <div className="opacity-0 animate-fade-in flex flex-col items-center justify-center mb-8">
          <div className="w-24 h-24 bg-primary text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 transition-transform hover:rotate-6 hover:scale-105 duration-300">
            <span className="text-5xl font-black">B</span>
          </div>
        </div>

        <h1 className="opacity-0 animate-fade-in text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]" style={{ animationDelay: '200ms' }}>
          Name your next big idea with <span className="text-primary relative inline-block">
            Brandsor.
            <Sparkles className="absolute -top-6 -right-8 text-primary w-8 h-8 animate-pulse" />
          </span>
        </h1>
        
        <p className="opacity-0 animate-fade-in text-lg sm:text-2xl text-gray-500 dark:text-gray-400 mb-12 max-w-2xl leading-relaxed" style={{ animationDelay: '400ms' }}>
          The ultimate AI-powered brand architect. Don't settle for boring names. Describe your vision, set your tone, and instantly generate premium identities for your startup.
        </p>
        
        <div className="opacity-0 animate-fade-in flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto px-4" style={{ animationDelay: '600ms' }}>
          
          <button 
            onClick={handleAuth}
            className="w-full sm:w-auto group flex items-center justify-center gap-3 bg-primary text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-primary/25 active:scale-95"
          >
            {user ? "Go to Dashboard" : "Login"}
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {!user && (
            <button 
              onClick={handleAuth}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 text-black dark:text-white px-8 py-4 rounded-full font-bold text-lg hover:border-primary hover:text-primary transition-all active:scale-95"
            >
              Signup
              <UserPlus className="w-5 h-5" />
            </button>
          )}

        </div>
      </div>
    </main>
  );
}
