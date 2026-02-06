"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const liveDataPoints = [
  { label: "Schumann", value: "7.83 Hz", trend: "+0.12", icon: Waves },
  { label: "Kp Index", value: "3", trend: "Moderate", icon: Activity },
  { label: "Moon", value: "Waxing", trend: "78%", icon: Moon },
  { label: "Solar", value: "M1.2", trend: "Active", icon: Sun },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20" aria-labelledby="hero-heading">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" aria-hidden="true" />

      <div className="container relative z-10 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-sm font-medium border-primary/30 bg-primary/10"
            >
              <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
              Powered by cosmic data correlation
            </Badge>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            id="hero-heading"
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Discover What&apos;s
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              Really Happening
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Data-driven predictions correlating cosmic events, biorhythms, and
            environmental patterns with real-world outcomes. No mysticism—just
            observable correlations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            role="group"
            aria-label="Primary actions"
          >
            <Button size="lg" className="gap-2 text-base px-8">
              <Brain className="w-5 h-5" aria-hidden="true" />
              View Today&apos;s Predictions
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="lg" className="gap-2 text-base px-8">
              <TrendingUp className="w-5 h-5" aria-hidden="true" />
              Explore Analytics
            </Button>
          </motion.div>

          {/* Live Data Preview */}
          <motion.div variants={itemVariants}>
            <div 
              className="inline-flex items-center gap-2 mb-4 text-sm text-muted-foreground"
              role="status"
              aria-label="Live data feed active"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Data Feed
            </div>
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
              role="region"
              aria-label="Current cosmic data readings"
            >
              {liveDataPoints.map((data, index) => (
                <motion.div
                  key={data.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileFocus={{ scale: 1.05 }}
                  className="group relative p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:border-primary/50 focus-within:border-primary/50 transition-all cursor-pointer"
                  tabIndex={0}
                  role="article"
                  aria-label={`${data.label}: ${data.value}, trend: ${data.trend}`}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <data.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                      <Badge variant="secondary" className="text-xs">
                        {data.trend}
                      </Badge>
                    </div>
                    <div className="font-bold text-2xl mb-1">
                      {data.value}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {data.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        </motion.div>
      </motion.div>
    </section>
  );
}
