"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  ChevronDown,
  Cloud,
  Heart,
  Moon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

// Sample prediction data (fallback when no live data)
const predictions = [
  {
    id: 1,
    title: "Energy & Productivity Surge",
    description: "Solar activity and geomagnetic conditions favor high energy output",
    probability: 78,
    confidence: "high",
    trend: "up",
    icon: Zap,
    category: "energy",
    factors: [
      { name: "Solar X-ray flux", contribution: "+12%", strength: 75 },
      { name: "Schumann resonance peak", contribution: "+8%", strength: 60 },
      { name: "Geomagnetic Kp < 4", contribution: "+5%", strength: 45 },
    ],
    timeframe: "Next 24 hours",
  },
  {
    id: 2,
    title: "Sleep Quality Improvement",
    description: "Lunar phase and geomagnetic calm indicate restful sleep",
    probability: 72,
    confidence: "high",
    trend: "up",
    icon: Moon,
    category: "sleep",
    factors: [
      { name: "Waning moon phase", contribution: "+15%", strength: 80 },
      { name: "Low Kp index", contribution: "+10%", strength: 65 },
      { name: "Stable barometric pressure", contribution: "+4%", strength: 40 },
    ],
    timeframe: "Tonight",
  },
  {
    id: 3,
    title: "Migraine Risk Elevated",
    description: "Barometric pressure changes may trigger sensitivity",
    probability: 45,
    confidence: "medium",
    trend: "down",
    icon: Cloud,
    category: "health",
    factors: [
      { name: "Pressure drop >5mb", contribution: "+18%", strength: 85 },
      { name: "Solar wind speed", contribution: "+6%", strength: 50 },
      { name: "Humidity increase", contribution: "+3%", strength: 35 },
    ],
    timeframe: "Next 48 hours",
  },
  {
    id: 4,
    title: "Creative Flow State",
    description: "Cosmic alignment patterns correlate with enhanced creativity",
    probability: 65,
    confidence: "medium",
    trend: "up",
    icon: Sparkles,
    category: "mental",
    factors: [
      { name: "Alpha wave resonance", contribution: "+10%", strength: 70 },
      { name: "Mercury direct motion", contribution: "+8%", strength: 55 },
      { name: "New moon energy", contribution: "+5%", strength: 45 },
    ],
    timeframe: "This week",
  },
  {
    id: 5,
    title: "Anxiety Levels Watch",
    description: "Geomagnetic storm approaching may affect mood",
    probability: 38,
    confidence: "low",
    trend: "down",
    icon: Activity,
    category: "mood",
    factors: [
      { name: "Kp index rising", contribution: "+12%", strength: 65 },
      { name: "Solar flare M-class", contribution: "+8%", strength: 55 },
      { name: "Full moon approaching", contribution: "+5%", strength: 40 },
    ],
    timeframe: "Next 72 hours",
  },
  {
    id: 6,
    title: "Heart Rate Variability",
    description: "Optimal conditions for cardiovascular coherence",
    probability: 82,
    confidence: "very-high",
    trend: "up",
    icon: Heart,
    category: "health",
    factors: [
      { name: "Schumann stability", contribution: "+14%", strength: 85 },
      { name: "Low solar activity", contribution: "+10%", strength: 70 },
      { name: "Circadian alignment", contribution: "+8%", strength: 60 },
    ],
    timeframe: "Today",
  },
];

const confidenceColors: Record<string, string> = {
  "very-high": "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  high: "bg-green-500/20 text-green-500 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  low: "bg-red-500/20 text-red-500 border-red-500/30",
};

const categoryColors: Record<string, string> = {
  energy: "from-amber-500/20 to-orange-500/20",
  sleep: "from-indigo-500/20 to-purple-500/20",
  health: "from-rose-500/20 to-red-500/20",
  mental: "from-cyan-500/20 to-blue-500/20",
  mood: "from-violet-500/20 to-fuchsia-500/20",
  wellness: "from-rose-500/20 to-pink-500/20",
};

interface Prediction {
  id: number;
  title: string;
  description: string;
  probability: number;
  confidence: string;
  trend: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  factors: { name: string; contribution: string; strength: number }[];
  timeframe: string;
}

function PredictionCard({ prediction, index }: { prediction: Prediction; index: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const Icon = prediction.icon;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30",
          expanded && "ring-2 ring-primary/20"
        )}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${prediction.title} prediction card. ${prediction.probability}% probability, ${prediction.confidence} confidence. Press Enter to ${expanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Gradient Background */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50",
            categoryColors[prediction.category] || categoryColors.energy
          )}
          aria-hidden="true"
        />

        <CardHeader className="relative pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-background/80" aria-hidden="true">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {prediction.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {prediction.timeframe}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-xs",
                  confidenceColors[prediction.confidence] || confidenceColors.medium
                )}
              >
                {prediction.confidence.replace("-", " ")}
              </Badge>
              <motion.div
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <p className="text-sm text-muted-foreground mb-4">
            {prediction.description}
          </p>

          {/* Probability Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" id={`probability-label-${prediction.id}`}>Probability</span>
              <div className="flex items-center gap-2">
                {prediction.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" aria-hidden="true" />
                )}
                <span className="sr-only">Trend: {prediction.trend === "up" ? "increasing" : "decreasing"}</span>
                <span className="font-bold text-2xl" aria-live="polite">
                  {prediction.probability}%
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress
                value={prediction.probability}
                className="h-3 bg-muted/50"
                aria-labelledby={`probability-label-${prediction.id}`}
                aria-valuenow={prediction.probability}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-4 border-t border-border/50"
              >
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" aria-hidden="true" />
                  Contributing Factors
                </h4>
                <div className="space-y-3" role="list" aria-label="Contributing factors">
                  {prediction.factors.map((factor, i) => (
                    <div key={i} className="flex items-center gap-3" role="listitem">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{factor.name}</span>
                          <span
                            className={cn(
                              "text-xs font-mono",
                              factor.contribution.startsWith("+")
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                            aria-label={`Contribution: ${factor.contribution}`}
                          >
                            {factor.contribution}
                          </span>
                        </div>
                        <div 
                          className="h-1.5 rounded-full bg-muted/50 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={factor.strength}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${factor.name} strength: ${factor.strength}%`}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${factor.strength}%` }}
                            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                            className="h-full rounded-full bg-primary/70"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4 gap-2"
                  aria-label={`View full analysis for ${prediction.title}`}
                >
                  View Full Analysis
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PredictionCards() {
  const { predictions: livePredictions, lastUpdate } = useWebSocket();

  // Validate and use live predictions when available, fall back to static sample data
  const activePredictions = React.useMemo(() => {
    if (!Array.isArray(livePredictions) || livePredictions.length === 0) return predictions;
    const isValidPrediction = (p: unknown): p is Prediction =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as Prediction).id === "number" &&
      typeof (p as Prediction).title === "string" &&
      typeof (p as Prediction).probability === "number" &&
      typeof (p as Prediction).description === "string" &&
      Array.isArray((p as Prediction).factors);
    const validated = livePredictions.filter(isValidPrediction);
    return validated.length > 0 ? validated : predictions;
  }, [livePredictions]);

  return (
    <section className="py-20" aria-labelledby="predictions-heading">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
            Today&apos;s Predictions
          </Badge>
          <h2 id="predictions-heading" className="text-3xl sm:text-4xl font-bold mb-4">
            Data-Driven Insights
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Predictions based on real-time analysis of cosmic data, environmental
            patterns, and historical correlations.
          </p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground/60 mt-2" aria-live="polite">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Prediction cards">
          {activePredictions.map((prediction, index) => (
            <PredictionCard
              key={prediction.id}
              prediction={prediction}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
