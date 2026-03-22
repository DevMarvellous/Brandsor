import { Twitter, Instagram, Github, PlaySquare } from "lucide-react";

export default function SocialIcons() {
  return (
    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
      <a href="https://twitter.com/adepojumarvellous" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Twitter className="w-5 h-5" />
      </a>
      <a href="https://instagram.com/adepojumarvellous" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Instagram className="w-5 h-5" />
      </a>
      <a href="https://tiktok.com/@adepojumarvellous" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <PlaySquare className="w-5 h-5" />
      </a>
      <a href="https://github.com/adepojumarvellous" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Github className="w-5 h-5" />
      </a>
    </div>
  );
}
