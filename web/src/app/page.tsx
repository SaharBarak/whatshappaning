"use client";

import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { PredictionCards } from "@/components/prediction-cards";
import { DataDashboard } from "@/components/data-dashboard";
import { PredictionTypes } from "@/components/prediction-types";
import { Newsletter } from "@/components/newsletter";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <PredictionCards />
      <DataDashboard />
      <PredictionTypes />
      <Newsletter />
      <Footer />
    </main>
  );
}
