"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <AnalyticsDashboard />
      </div>
      <Footer />
    </main>
  );
}
