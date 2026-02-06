"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  Gauge,
  Moon,
  Radio,
  Sun,
  TrendingUp,
  Waves,
  Wind,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Sample Schumann Resonance Data (24 hours)
const schumannData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i.toString().padStart(2, "0")}:00`,
  frequency: 7.83 + (Math.random() * 0.3 - 0.15),
  amplitude: 0.5 + Math.random() * 0.3,
  q1: 7.83 + Math.random() * 0.2,
  q2: 14.1 + Math.random() * 0.3,
  q3: 20.3 + Math.random() * 0.4,
}));

// Prediction Accuracy Data
const accuracyData = [
  { name: "Energy", accuracy: 78, predictions: 245 },
  { name: "Sleep", accuracy: 72, predictions: 189 },
  { name: "Mood", accuracy: 65, predictions: 312 },
  { name: "Health", accuracy: 58, predictions: 156 },
  { name: "Creative", accuracy: 61, predictions: 98 },
];

// Correlation Strength Data
const correlationData = [
  { name: "Schumann-Mood", value: 72, fill: "hsl(var(--chart-1))" },
  { name: "Solar-Energy", value: 68, fill: "hsl(var(--chart-2))" },
  { name: "Lunar-Sleep", value: 65, fill: "hsl(var(--chart-3))" },
  { name: "Geo-Anxiety", value: 58, fill: "hsl(var(--chart-4))" },
  { name: "Pressure-Migraine", value: 74, fill: "hsl(var(--chart-5))" },
];

// Timeline events
const timelineData = [
  { date: "Feb 1", events: 3, correlations: 2, accuracy: 75 },
  { date: "Feb 2", events: 5, correlations: 4, accuracy: 82 },
  { date: "Feb 3", events: 2, correlations: 1, accuracy: 68 },
  { date: "Feb 4", events: 7, correlations: 5, accuracy: 85 },
  { date: "Feb 5", events: 4, correlations: 3, accuracy: 71 },
  { date: "Feb 6", events: 6, correlations: 4, accuracy: 79 },
  { date: "Feb 7", events: 3, correlations: 2, accuracy: 76 },
];

// Data modules status
const dataModules = [
  { name: "Schumann Resonance", icon: Waves, status: "live", value: "7.83 Hz" },
  { name: "Solar Activity", icon: Sun, status: "live", value: "M1.2" },
  { name: "Lunar Phase", icon: Moon, status: "live", value: "Waxing 78%" },
  { name: "Geomagnetic", icon: Activity, status: "live", value: "Kp 3" },
  { name: "Barometric", icon: Gauge, status: "recent", value: "1013 mb" },
  { name: "Solar Wind", icon: Wind, status: "live", value: "425 km/s" },
  { name: "Cosmic Rays", icon: Radio, status: "stale", value: "Moderate" },
  { name: "Biorhythm", icon: Brain, status: "live", value: "High" },
];

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}: <span className="font-mono">{entry.value.toFixed(2)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function SchumannChart() {
  return (
    <Card className="col-span-full lg:col-span-2" role="region" aria-label="Schumann Resonance chart">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-primary" aria-hidden="true" />
          <CardTitle className="font-display">Schumann Resonance</CardTitle>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/30" role="status" aria-label="Live data feed">
          <span className="relative flex h-2 w-2 mr-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
          </span>
          Live
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={schumannData}>
              <defs>
                <linearGradient id="schumannGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                domain={[7.5, 8.2]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value} Hz`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="frequency"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#schumannGradient)"
                name="Frequency"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-display font-bold text-primary">7.83</p>
            <p className="text-xs text-muted-foreground">Q1 Fundamental (Hz)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold">14.1</p>
            <p className="text-xs text-muted-foreground">Q2 Second (Hz)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-display font-bold">20.3</p>
            <p className="text-xs text-muted-foreground">Q3 Third (Hz)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccuracyChart() {
  return (
    <Card role="region" aria-label="Prediction accuracy chart">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
        <CardTitle className="font-display">Prediction Accuracy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accuracyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} name="Accuracy">
                {accuracyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CorrelationGauge() {
  return (
    <Card role="region" aria-label="Correlation strength chart">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <TrendingUp className="w-5 h-5 text-primary" aria-hidden="true" />
        <CardTitle className="font-display">Correlation Strength</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="90%"
              barSize={10}
              data={correlationData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                background
                dataKey="value"
                cornerRadius={5}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineChart() {
  return (
    <Card className="col-span-full" role="region" aria-label="Event correlation timeline chart">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
        <CardTitle className="font-display">Event Correlation Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="events"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))" }}
                name="Events"
              />
              <Line
                type="monotone"
                dataKey="correlations"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
                name="Correlations"
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-3))" }}
                name="Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DataModulesGrid() {
  return (
    <Card className="col-span-full" role="region" aria-label="Data modules status">
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Radio className="w-5 h-5 text-primary" aria-hidden="true" />
        <CardTitle className="font-display">Data Modules</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list" aria-label="Active data modules">
          {dataModules.map((module, index) => {
            const Icon = module.icon;
            const statusLabel = module.status === "live" ? "Live data" : 
                               module.status === "recent" ? "Recently updated" : "Data may be stale";
            return (
              <motion.div
                key={module.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 rounded-xl border bg-card/50 hover:bg-muted/50 focus-within:bg-muted/50 transition-colors cursor-pointer",
                  module.status === "live" && "border-success/30",
                  module.status === "recent" && "border-amber-500/30",
                  module.status === "stale" && "border-red-500/30"
                )}
                role="listitem"
                tabIndex={0}
                aria-label={`${module.name}: ${module.value}, status: ${statusLabel}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs capitalize",
                      module.status === "live" && "bg-success/10 text-success border-success/30",
                      module.status === "recent" && "bg-amber-500/10 text-amber-500 border-amber-500/30",
                      module.status === "stale" && "bg-red-500/10 text-red-500 border-red-500/30"
                    )}
                    aria-hidden="true"
                  >
                    {module.status}
                  </Badge>
                </div>
                <p className="font-display font-bold text-lg">{module.value}</p>
                <p className="text-xs text-muted-foreground">{module.name}</p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function DataDashboard() {
  return (
    <section className="py-20 bg-muted/30" aria-labelledby="dashboard-heading">
      <div className="container px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Activity className="w-4 h-4 mr-2" aria-hidden="true" />
            Real-Time Analytics
          </Badge>
          <h2 id="dashboard-heading" className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Data Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Live data streams from multiple cosmic and environmental sources,
            powering our prediction engine.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schumann">Schumann</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <SchumannChart />
              <AccuracyChart />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <CorrelationGauge />
              <TimelineChart />
            </div>
            <DataModulesGrid />
          </TabsContent>

          <TabsContent value="schumann">
            <SchumannChart />
          </TabsContent>

          <TabsContent value="accuracy">
            <div className="grid lg:grid-cols-2 gap-6">
              <AccuracyChart />
              <CorrelationGauge />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
