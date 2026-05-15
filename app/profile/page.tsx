"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProfileDashboard from "@/components/ProfileDashboard";
import VendorProfile from "@/components/vendor/VendorProfile";
import { useHydrated } from "@/lib/auth-client";

export default function ProfilePage() {
  const [role, setRole] = useState<string | null>(null);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const token = localStorage.getItem("agroshield_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setRole(payload.role);
      } catch (e) {
        console.error("Failed to parse token role", e);
      }
    }
  }, [hydrated]);

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        {role === "VENDOR" ? <VendorProfile /> : <ProfileDashboard />}
      </main>
      <Footer />
    </div>
  );
}
