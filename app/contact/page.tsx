"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Send, Loader2, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Error sending message");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-6 py-16">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Get in touch.</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-12">
          Have a question, feedback, or feature request? We'd love to hear from you.
        </p>

        {status === "success" ? (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 p-8 rounded-2xl flex flex-col items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">Message Received!</h2>
            <p className="text-green-600 dark:text-green-500">Thanks for reaching out. We will get back to you shortly.</p>
            <button 
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm font-medium underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary"
                placeholder="John Doe"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary"
                placeholder="john@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-xl outline-none focus:ring-2 ring-primary resize-none min-h-[150px]"
                placeholder="How can we help you?"
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm font-medium">{errorText}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-4 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 mt-2"
            >
              {status === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
