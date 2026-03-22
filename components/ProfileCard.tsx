import Image from "next/image";
import SocialIcons from "./SocialIcons";

export default function ProfileCard() {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center shadow-sm max-w-sm w-full mx-auto">

      {/* Updated Image Section */}
      <div className="w-32 h-32 rounded-full overflow-hidden relative mb-6 border-4 border-primary/20">
        <Image
          src="/developer.jpg" // Change this to your filename in the public folder
          alt="Marvellous Adepoju"
          fill
          className="object-cover"
        />
      </div>

      <h2 className="text-3xl font-bold mb-2">Marvellous Adepoju</h2>
      <p className="text-primary font-medium mb-6">Founder & Developer</p>
      <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
        Building scalable and user-friendly web applications. Reach out on social media or connect with me for opportunities.
      </p>

      <div className="scale-125">
        <SocialIcons />
      </div>
    </div>
  );
}
