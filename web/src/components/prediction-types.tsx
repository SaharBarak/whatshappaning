"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Battery,
  BedDouble,
  Brain,
  Cloud,
  Gauge,
  Globe,
  Heart,
  Laptop,
  MessageSquare,
  Moon,
  Sparkles,
  Sun,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// New prediction types with creative correlations
const predictionTypes = [
  {
    id: "solar-energy",
    title: "Solar Flare Energy",
    description: "Track how X-ray flux and solar wind affect your daily energy levels and productivity patterns.",
    icon: Sun,
    gradient: "from-amber-500 to-orange-600",
    correlations: [
      { source: "X-ray Flux", target: "Energy Levels", strength: 72 },
      { source: "Solar Wind", target: "Focus Duration", strength: 65 },
      { source: "Proton Events", target: "Fatigue Onset", strength: 58 },
    ],
    dataPoints: ["X-ray flux class", "Solar wind speed", "Proton density"],
    accuracy: 78,
    status: "active",
  },
  {
    id: "lunar-sleep",
    title: "Lunar Sleep Patterns",
    description: "Discover how moon phases and illumination correlate with your sleep quality and dream intensity.",
    icon: Moon,
    gradient: "from-indigo-500 to-purple-600",
    correlations: [
      { source: "Moon Phase", target: "Sleep Duration", strength: 68 },
      { source: "Illumination %", target: "REM Quality", strength: 62 },
      { source: "Lunar Distance", target: "Sleep Onset", strength: 55 },
    ],
    dataPoints: ["Phase", "Illumination", "Distance", "Zodiac sign"],
    accuracy: 72,
    status: "active",
  },
  {
    id: "geomagnetic-mood",
    title: "Geomagnetic Mood Index",
    description: "Monitor geomagnetic storms and Kp index fluctuations to anticipate anxiety and stress patterns.",
    icon: Activity,
    gradient: "from-violet-500 to-fuchsia-600",
    correlations: [
      { source: "Kp Index", target: "Anxiety Levels", strength: 64 },
      { source: "Dst Index", target: "Mood Stability", strength: 59 },
      { source: "Storm Onset", target: "Stress Response", strength: 71 },
    ],
    dataPoints: ["Kp index", "Dst index", "Storm probability"],
    accuracy: 65,
    status: "active",
  },
  {
    id: "biorhythm",
    title: "Biorhythm Forecast",
    description: "Calculate your physical, emotional, and intellectual cycles based on birth date mathematics.",
    icon: Heart,
    gradient: "from-rose-500 to-red-600",
    correlations: [
      { source: "Physical Cycle", target: "Workout Performance", strength: 66 },
      { source: "Emotional Cycle", target: "Social Energy", strength: 61 },
      { source: "Intellectual Cycle", target: "Problem Solving", strength: 58 },
    ],
    dataPoints: ["23-day physical", "28-day emotional", "33-day intellectual"],
    accuracy: 61,
    status: "active",
  },
  {
    id: "pressure-health",
    title: "Barometric Health Alerts",
    description: "Track atmospheric pressure changes to predict migraines, joint pain, and weather-related symptoms.",
    icon: Gauge,
    gradient: "from-cyan-500 to-blue-600",
    correlations: [
      { source: "Pressure Drop", target: "Migraine Risk", strength: 74 },
      { source: "Humidity Spike", target: "Joint Stiffness", strength: 68 },
      { source: "Storm Front", target: "Symptom Onset", strength: 71 },
    ],
    dataPoints: ["Pressure mb", "Change rate", "Humidity %", "Front proximity"],
    accuracy: 74,
    status: "active",
  },
  {
    id: "mercury-retrograde",
    title: "Mercury Retrograde Watch",
    description: "Analyze Mercury&apos;s apparent retrograde motion and its correlation with communication and tech issues.",
    icon: MessageSquare,
    gradient: "from-emerald-500 to-teal-600",
    correlations: [
      { source: "Retrograde Phase", target: "Communication Mix-ups", strength: 45 },
      { source: "Station Periods", target: "Tech Glitches", strength: 38 },
      { source: "Shadow Period", target: "Contract Issues", strength: 42 },
    ],
    dataPoints: ["Retrograde status", "Station dates", "Shadow periods"],
    accuracy: 42,
    status: "experimental",
  },
  {
    id: "schumann-resonance",
    title: "Schumann Resonance Sync",
    description: "Monitor Earth&apos;s electromagnetic pulse and its effects on collective mood and consciousness.",
    icon: Waves,
    gradient: "from-blue-500 to-indigo-600",
    correlations: [
      { source: "Base Frequency", target: "Meditation Depth", strength: 67 },
      { source: "Amplitude Spikes", target: "Intuition Clarity", strength: 55 },
      { source: "Harmonic Shifts", target: "Collective Mood", strength: 52 },
    ],
    dataPoints: ["7.83 Hz base", "Harmonics", "Amplitude", "Global coherence"],
    accuracy: 58,
    status: "active",
  },
  {
    id: "planetary-alignment",
    title: "Planetary Alignment Index",
    description: "Track major planetary configurations and their correlation with collective energy shifts.",
    icon: Globe,
    gradient: "from-pink-500 to-rose-600",
    correlations: [
      { source: "Conjunction Events", target: "Collective Focus", strength: 48 },
      { source: "Opposition Aspects", target: "Tension Levels", strength: 45 },
      { source: "Grand Configurations", target: "Trend Shifts", strength: 52 },
    ],
    dataPoints: ["Active aspects", "Planetary hours", "Void of course"],
    accuracy: 48,
    status: "experimental",
  },
];

function CorrelationBar({ source, target, strength }: { source: string; target: string; strength: number }) {
  const barId = `correlation-${source}-${target}`.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground" id={barId}>{source} → {target}</span>
        <span className="font-mono font-medium">{strength}%</span>
      </div>
      <div 
        className="h-1.5 rounded-full bg-muted/50 overflow-hidden"
        role="progressbar"
        aria-valuenow={strength}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-labelledby={barId}
      >
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${strength}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            strength >= 70 ? "bg-green-500" : strength >= 50 ? "bg-amber-500" : "bg-blue-500"
          )}
        />
      </div>
    </div>
  );
}

function PredictionTypeCard({ type, index }: { type: typeof predictionTypes[0]; index: number }) {
  const Icon = type.icon;
  const [expanded, setExpanded] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      role="listitem"
    >
      <Card 
        className="group relative h-full overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl focus-within:shadow-xl"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${type.title} prediction category. ${type.accuracy}% accuracy. ${type.status} status. Press Enter to ${expanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Gradient Header */}
        <div className={cn(
          "h-2 bg-gradient-to-r",
          type.gradient
        )} aria-hidden="true" />

        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br",
              type.gradient
            )} aria-hidden="true">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-lg">{type.title}</h3>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs capitalize",
                    type.status === "active" 
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  )}
                >
                  {type.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {type.description}
              </p>
            </div>
          </div>

          {/* Accuracy Badge */}
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground" id={`accuracy-label-${type.id}`}>Historical Accuracy</span>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                type.accuracy >= 70 ? "bg-green-500" : type.accuracy >= 50 ? "bg-amber-500" : "bg-blue-500"
              )} aria-hidden="true" />
              <span className="font-display font-bold text-lg" aria-labelledby={`accuracy-label-${type.id}`}>{type.accuracy}%</span>
            </div>
          </div>

          {/* Correlations */}
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Key Correlations
            </h4>
            {type.correlations.map((corr, i) => (
              <CorrelationBar key={i} {...corr} />
            ))}
          </div>

          {/* Data Points */}
          <div className="flex flex-wrap gap-2">
            {type.dataPoints.slice(0, expanded ? undefined : 3).map((point, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {point}
              </Badge>
            ))}
            {!expanded && type.dataPoints.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{type.dataPoints.length - 3} more
              </Badge>
            )}
          </div>

          {/* CTA */}
          <Button 
            variant="ghost" 
            className="w-full mt-4 gap-2 group-hover:bg-muted"
            aria-label={`Explore ${type.title} predictions`}
          >
            Explore Predictions
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PredictionTypes() {
  return (
    <section className="py-20" aria-labelledby="prediction-types-heading">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            Correlation Engine
          </Badge>
          <h2 id="prediction-types-heading" className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Prediction Categories
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our engine analyzes data from multiple cosmic and environmental sources,
            finding statistically significant correlations with real-world outcomes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label="Prediction category cards">
          {predictionTypes.map((type, index) => (
            <PredictionTypeCard key={type.id} type={type} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Want to suggest a new correlation to track?
          </p>
          <Button variant="outline" className="gap-2" aria-label="Suggest a new correlation to track">
            <Brain className="w-4 h-4" aria-hidden="true" />
            Suggest Correlation
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
