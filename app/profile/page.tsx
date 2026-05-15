"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProfileDashboard from "@/components/ProfileDashboard";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <Nav />
      <ProfileDashboard />
      <Footer />
    </div>
  );
}
