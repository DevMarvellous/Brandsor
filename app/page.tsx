"use client";

import { useState, useEffect } from "react";
import { Sparkles, Mail, Check, Zap, Shield, Users, ArrowRight, Star, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

// Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Brandsor",
  "description": "Generate production-ready brandable startup names with AI. Build your entire brand identity from naming to complete brand development.",
  "url": "https://brandsor.vercel.app",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "Brandsor Team"
  },
  "featureList": [
    "AI-powered brand name generation",
    "Brand identity development",
    "Business naming tools",
    "Brand strategy insights",
    "Logo and visual identity guidance"
  ]
};

export default function WaitlistLandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(127);
  const [error, setError] = useState("");
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);

  useEffect(() => {
    // Check if user is automatically signed in
    const checkAutoSignIn = async () => {
      try {
        const { auth } = await import("@/lib/firebase");
        
        // Show auto-signin indicator if we don't have a user immediately
        const timer = setTimeout(() => {
          if (!auth.currentUser) {
            setIsAutoSigningIn(true);
          }
        }, 500);

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
          setIsAutoSigningIn(false);
          clearTimeout(timer);
          if (currentUser) {
            // Redirect to dashboard if user is already signed in
            window.location.href = "/dashboard";
          }
        });

        return () => {
          unsubscribe();
          clearTimeout(timer);
        };
      } catch (error) {
        console.error("Error checking auth state:", error);
      }
    };

    // Fetch waitlist count
    fetch("/api/waitlist")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWaitlistCount(data.count + 127); // Add base number for social proof
        }
      })
      .catch(() => {}); // Silently fail

    checkAutoSignIn();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || "Something went wrong");
      }

      setSubmitted(true);
      if (!data.exists) {
        setWaitlistCount(prev => prev + 1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to join waitlist. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-primary/10 dark:via-[#0f0f0f] dark:to-primary/10">
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">You're on the list!</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Get ready to revolutionize your branding game. We'll notify you as soon as Brandsor launches.
            </p>
            <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl p-6 mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Share with friends</p>
              <p className="text-2xl font-bold text-primary">{waitlistCount}+ people waiting</p>
            </div>
            <Link 
              href="/auth" 
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              Try It Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-primary/10 dark:via-[#0f0f0f] dark:to-primary/10">
      {/* Navigation */}
      <nav className="w-full flex items-center justify-between p-6 px-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black">B</div>
          <span className="font-bold text-xl tracking-tight">Brandsor</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto-signin indicator */}
          {isAutoSigningIn && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-700 dark:text-blue-300">Welcome back...</span>
            </div>
          )}
          <Link 
                href="/auth" 
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Try It Now
              </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-primary text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 transition-transform hover:rotate-6 hover:scale-105 duration-300">
              <span className="text-5xl font-black">B</span>
            </div>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Brand Development
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            Build your entire brand with{' '}
            <span className="text-primary relative inline-block">
              Brandsor
              <Sparkles className="absolute -top-6 -right-8 text-primary w-8 h-8 animate-pulse" />
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            From naming to brand identity, our AI helps you develop every aspect of your brand. 
            Starting with intelligent name generation and expanding to complete brand development tools.
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 ring-primary focus:border-transparent outline-none transition-all"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-black px-6 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Waitlist
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </form>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join <span className="font-bold text-primary">{waitlistCount}+</span> entrepreneurs waiting for early access
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Brandsor?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              The complete AI-powered brand development platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-[#0f0f0f] p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Intelligent Naming</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Generate brandable names with taglines that capture your essence. Starting with names, expanding to full brand identity.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0f0f0f] p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Brand Strategy</h3>
              <p className="text-gray-600 dark:text-gray-400">
                AI-driven insights for positioning, messaging, and visual identity. Building complete brands from the ground up.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0f0f0f] p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Brand Assets</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Save, organize, and develop your brand elements over time. From names to logos, taglines to brand guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Three steps to build your complete brand identity
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Define Your Vision</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your business concept, values, and target audience
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">AI Brand Development</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our AI creates names, taglines, and strategic brand elements
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Build & Evolve</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Develop your brand assets and refine your identity over time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
          <blockquote className="text-2xl font-medium mb-6 max-w-3xl mx-auto">
            "Brandsor transformed our entire brand development process. From naming to strategy, everything just clicked!"
          </blockquote>
          <p className="text-gray-600 dark:text-gray-400">— Joseph Oloyede</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-primary text-black p-12 rounded-3xl">
            <TrendingUp className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your Brand?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of entrepreneurs developing complete brand identities with AI
            </p>
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-4 bg-white/90 rounded-xl focus:ring-2 ring-white/50 outline-none transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-black text-primary px-6 py-4 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                >
                  Get Early Access
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
