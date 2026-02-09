"use client";

import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { PredictionCards } from "@/components/prediction-cards";
import { DataDashboard } from "@/components/data-dashboard";
import { PredictionTypes } from "@/components/prediction-types";
import { Newsletter } from "@/components/newsletter";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen" role="main" tabIndex={-1}>
        <Hero />
        <Suspense fallback={null}>
          <PredictionCards />
        </Suspense>
        <DataDashboard />
        <PredictionTypes />
        <Newsletter />
        <Footer />
      </main>
    </>
  );
}
