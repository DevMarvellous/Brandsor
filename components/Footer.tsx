import Link from "next/link";
import SocialIcons from "./SocialIcons";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800 p-8 mt-12 bg-gray-50 dark:bg-[#0f0f0f]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">Brandsor</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">© {new Date().getFullYear()}</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          <Link href="/credits" className="hover:text-primary transition-colors">Credits</Link>
        </div>

        <SocialIcons />
      </div>
    </footer>
  );
}
