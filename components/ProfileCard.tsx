import Image from "next/image";
import SocialIcons from "./SocialIcons";

export default function ProfileCard() {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center shadow-sm max-w-sm w-full mx-auto">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-6 border-4 border-primary/20">
        <svg className="w-full h-full text-gray-400 p-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold mb-2">Adepoju Marvellous</h2>
      <p className="text-primary font-medium mb-6">Developer</p>
      
      <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        Building scalable and user-friendly web applications. Reach out on social media or connect with me for opportunities.
      </p>

      <div className="scale-125">
        <SocialIcons />
      </div>
    </div>
  );
}
