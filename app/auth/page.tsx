"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);

  useEffect(() => {
    // Show auto-signin indicator if we don't have a user immediately
    const timer = setTimeout(() => {
      if (!auth.currentUser) {
        setIsAutoSigningIn(true);
      }
    }, 500);

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAutoSigningIn(false);
      clearTimeout(timer);
      if (currentUser) {
        router.push("/dashboard");
      }
    });
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [router]);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-primary/10 dark:via-[#0f0f0f] dark:to-primary/10">
      {/* Navigation */}
      <nav className="w-full flex items-center justify-between p-6 px-8">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black">B</div>
          <span className="font-bold text-xl tracking-tight">Brandsor</span>
        </div>
      </nav>

      {/* Auth Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 mx-auto mb-6">
              <span className="text-4xl font-black">B</span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">Welcome to Brandsor</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Continue to start generating amazing brand names with AI
            </p>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            {/* Auto-signin indicator */}
            {isAutoSigningIn && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Welcome back!</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Automatically signing you in...</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={isLoading || isAutoSigningIn}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-gray-800 text-black dark:text-white px-6 py-4 rounded-xl font-medium hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Try It Out</span>
            </div>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>✨ Test AI-powered name generation</li>
              <li>🎨 Explore different tones and styles</li>
              <li>💾 Save your favorite combinations</li>
              <li>🎯 See if it fits your needs</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
