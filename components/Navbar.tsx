"use client";

import Link from "next/link";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Menu, X, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <>
      <nav className="w-full flex items-center justify-between p-4 px-4 sm:px-8 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0f0f0f]/50 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-black">B</div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Brandsor</span>
          <span className="font-bold text-lg tracking-tight sm:hidden">B</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          <Link href="/saved" className="text-sm font-medium hover:text-primary transition-colors">Saved Names</Link>
          <Link href="/credits" className="text-sm font-medium hover:text-primary transition-colors">Credits</Link>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm hidden lg:inline-block">{user.displayName}</span>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <button 
                onClick={handleSignOut}
                className="text-sm bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all font-medium"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link 
              href="/auth"
              className="text-sm bg-primary text-black px-4 py-2 rounded-full font-medium hover:scale-105 transition-transform"
            >
              Continue with Google
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 top-16 z-40 bg-white dark:bg-[#0f0f0f] border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col p-4 space-y-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link 
              href="/saved" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="font-medium">Saved Names</span>
            </Link>
            <Link 
              href="/credits" 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="font-medium">Credits</span>
            </Link>
            
            {user ? (
              <>
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="font-medium text-sm">{user.displayName}</span>
                  </div>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  >
                    <span className="font-medium">Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/auth"
                className="w-full flex items-center justify-center gap-2 bg-primary text-black px-4 py-3 rounded-full font-medium hover:scale-105 transition-transform"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Continue with Google
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
