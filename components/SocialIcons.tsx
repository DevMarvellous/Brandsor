import { Twitter, Instagram, Github, Linkedin } from "lucide-react";

export default function SocialIcons() {
  return (
    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
      <a href="https://x.com/marvel_14_code" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Twitter className="w-5 h-5" />
      </a>
      <a href="https://instagram.com/marvel_develops" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Instagram className="w-5 h-5" />
      </a>
      <a href="https://linkedin.com/in/marvellous-adepoju-a33a893a2" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Linkedin className="w-5 h-5" />
      </a>
      <a href="https://github.com/DevMarvellous" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
        <Github className="w-5 h-5" />
      </a>
    </div>
  );
}
