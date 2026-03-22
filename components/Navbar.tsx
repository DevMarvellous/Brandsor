"use client";

import Link from "next/link";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className="w-full flex items-center justify-between p-4 px-8 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0f0f0f]/50 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black">B</div>
        <span className="font-bold text-xl tracking-tight">Brandsor</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
        <Link href="/saved" className="text-sm font-medium hover:text-primary transition-colors">Saved Names</Link>
        <Link href="/credits" className="text-sm font-medium hover:text-primary transition-colors">Credits</Link>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline-block">{user.displayName}</span>
            <button 
              onClick={handleSignOut}
              className="text-sm bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all font-medium"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="text-sm bg-primary text-black px-4 py-2 rounded-full font-medium hover:scale-105 transition-transform"
          >
            Google Login
          </button>
        )}
      </div>
    </nav>
  );
}
