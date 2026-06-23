import { Twitter, Instagram, Github, Linkedin, type LucideIcon } from "lucide-react";

export type SocialLink = {
  label: string;
  handle: string;
  href: string;
  Icon: LucideIcon;
};

// Single source of truth for the social profiles — rendered compactly in the
// footer below, and in a larger, labeled treatment on the contact page
// (app/contact/page.tsx). Update links here only.
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "X", handle: "@marvel_14_code", href: "https://x.com/marvel_14_code", Icon: Twitter },
  { label: "Instagram", handle: "@marvel_develops", href: "https://instagram.com/marvel_develops", Icon: Instagram },
  { label: "LinkedIn", handle: "Marvellous Adepoju", href: "https://linkedin.com/in/marvellous-adepoju-a33a893a2", Icon: Linkedin },
  { label: "GitHub", handle: "DevMarvellous", href: "https://github.com/DevMarvellous", Icon: Github },
];

// Compact, de-emphasized row for the site footer.
export default function SocialIcons() {
  return (
    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
      {SOCIAL_LINKS.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="hover:text-primary transition-colors"
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}
