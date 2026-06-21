"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Layers,
  Globe,
  Palette,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Footer from "@/components/Footer";

// Structured Data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Brandsor",
  description:
    "Generate AI brand names, build a complete brand workspace — logo, colors, fonts and guidelines — and publish a shareable public brand profile.",
  url: "https://brandsor.xyz",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "Brandsor Team",
  },
  featureList: [
    "AI-powered brand name generation",
    "Brand workspace: logo, palette, typography, guidelines",
    "Everything for one brand in a single place",
    "Public, shareable brand profile pages",
  ],
};

const STEPS = [
  {
    n: "1",
    title: "Generate",
    body: "Tell us your idea and get a list of brandable names with taglines in seconds.",
  },
  {
    n: "2",
    title: "Create a brand",
    body: "Pick a name — or bring your own — and turn it into a brand workspace in one click. AI even drafts your starter colors and brand voice.",
  },
  {
    n: "3",
    title: "Make it yours",
    body: "Add your logo, colors, fonts, and brand guidelines. Everything for your brand lives in one place.",
  },
  {
    n: "4",
    title: "Share",
    body: "Publish a public page with your own link — something you can show clients, investors, or friends.",
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Everything in one place",
    body: "Your logo, colors, fonts, and guidelines all live together in one tidy brand workspace — no more scattered files and screenshots.",
  },
  {
    icon: Globe,
    title: "A shareable brand page",
    body: "A clean public page at your own link — proof of your work to show clients, investors, or just yourself.",
  },
  {
    icon: Palette,
    title: "AI brand starter",
    body: "Skip the blank page. AI drafts your starter colors and a brand-voice guideline the moment you create a brand.",
  },
];

export default function HomePage() {
  const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);
  // "Sign in" only renders once we've confirmed there's no session — otherwise
  // a signed-in user who lands here (e.g. via the navbar logo) briefly sees a
  // signed-out-looking page before the redirect below kicks in, which reads
  // as "this logged me out."
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    // Show auto-signin indicator while we resolve the session.
    const timer = setTimeout(() => setIsAutoSigningIn(true), 500);
    let unsubscribe = () => {};

    const resolve = (hasSession: boolean) => {
      clearTimeout(timer);
      if (hasSession) {
        window.location.href = "/dashboard";
      } else {
        setIsAutoSigningIn(false);
        setShowSignIn(true);
      }
    };

    // Lazy-load Supabase so it stays out of the landing page's initial bundle.
    import("@/lib/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => resolve(!!data.session));
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) =>
        resolve(!!session)
      );
      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-primary/5 via-white to-primary/5 dark:from-primary/10 dark:via-[#0f0f0f] dark:to-primary/10">
        {/* Decorative ambient glow — pure CSS, no images, hidden on small screens to save paint cost */}
        <div className="hidden sm:block pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="w-full flex items-center justify-between gap-3 p-4 sm:p-6 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black">
              B
            </div>
            <span className="font-bold text-xl tracking-tight">Brandsor</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {isAutoSigningIn && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Welcome back...
                </span>
              </div>
            )}
            {showSignIn && (
              <Link
                href="/auth"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="max-w-6xl mx-auto text-center animate-fade-in-up">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary text-black rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 transition-transform hover:rotate-6 hover:scale-105 duration-300">
                <span className="text-4xl sm:text-5xl font-black">B</span>
              </div>
            </div>

            <div className="mb-6">
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Your whole brand, in one place
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
              Build your brand.
              <br />
              <span className="text-primary relative inline-block">
                Share it anywhere.
                <Sparkles className="hidden sm:block absolute -top-6 -right-8 text-primary w-8 h-8 animate-pulse" />
              </span>
            </h1>

            <p className="text-lg sm:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
              Generate brandable names with AI, then build a complete brand
              identity — logo, colors, fonts, and guidelines — and share it with
              your own public link.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/auth"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-black px-8 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/25"
              >
                Start Building — It's Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium border border-gray-300 dark:border-gray-800 hover:border-primary transition-colors"
              >
                See how it works
              </a>
            </div>

            {/* Understated try-before-sign-in path: a quiet link, not a headline.
                Anonymous visitors get a couple of free generations on the dashboard
                before being nudged to sign in (see lib/anonLimits.ts). */}
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              or{" "}
              <Link
                href="/dashboard"
                className="underline underline-offset-4 decoration-gray-300 dark:decoration-gray-700 hover:text-primary hover:decoration-primary transition-colors"
              >
                try generating a few names first
              </Link>
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                From a one-line idea to a shareable brand profile
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {STEPS.map((step, i) => (
                <div
                  key={step.n}
                  className="text-center animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.n}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Brandsor?</h2>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                Not just a name generator — a home for your brand identity
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {FEATURES.map(({ icon: Icon, title, body }, i) => (
                <div
                  key={title}
                  className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-2xl border border-gray-300 dark:border-gray-800 hover:border-primary/50 hover:-translate-y-1 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-3">{title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-primary text-black p-8 sm:p-12 rounded-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to build your brand?
              </h2>
              <p className="text-lg sm:text-xl mb-8 opacity-90">
                Free to start. No credit card, no waitlist.
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 bg-black text-primary px-8 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
