import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileCard from "@/components/ProfileCard";

export default function CreditsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-16">
        <ProfileCard />
      </main>
      <Footer />
    </div>
  );
}
