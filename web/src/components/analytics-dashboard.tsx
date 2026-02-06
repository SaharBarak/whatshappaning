"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Types
interface RollingAccuracy {
  days: number;
  total: number;
  correct: number;
  accuracy: string | null;
  avgPredicted: string | null;
  actualRate: string | null;
  avgConfidence: string | null;
  brierScore: string | null;
  calibrationError: string | null;
}

interface Streak {
  type: "win" | "loss";
  length: number;
  startDate: string;
}

interface CategoryAccuracy {
  category: string;
  total: number;
  correct: number;
  accuracy: string | null;
}

interface CalibrationPoint {
  bucket: string;
  bucketMid: number;
  total: number;
  hits: number;
  hitRate: string | null;
  avgPredicted: string | null;
  calibrationGap: string | null;
}

interface TrendPoint {
  date: string;
  total: number;
  correct: number;
  accuracy: string | null;
  brierScore: string | null;
}

interface DashboardData {
  generatedAt: string;
  period: { days: number };
  rolling: {
    "7d": RollingAccuracy;
    "30d": RollingAccuracy;
    "90d": RollingAccuracy;
  };
  streaks: {
    current: Record<string, Streak>;
    longest: {
      win: { outcome: string; length: number; startDate: string; endDate: string } | null;
      loss: { outcome: string; length: number; startDate: string; endDate: string } | null;
    };
  };
  bestWorstPeriods: {
    windowDays: number;
    best: { periodStart: string; periodEnd: string; accuracy: string } | null;
    worst: { periodStart: string; periodEnd: string; accuracy: string } | null;
  };
  byCategory: CategoryAccuracy[];
  calibration: CalibrationPoint[];
  trend: TrendPoint[];
}

// Sample data for demo (when API not available)
const sampleData: DashboardData = {
  generatedAt: new Date().toISOString(),
  period: { days: 90 },
  rolling: {
    "7d": { days: 7, total: 84, correct: 58, accuracy: "69.0", avgPredicted: "0.612", actualRate: "0.583", avgConfidence: "0.724", brierScore: "0.2134", calibrationError: "0.029" },
    "30d": { days: 30, total: 360, correct: 245, accuracy: "68.1", avgPredicted: "0.598", actualRate: "0.567", avgConfidence: "0.711", brierScore: "0.2287", calibrationError: "0.031" },
    "90d": { days: 90, total: 1080, correct: 712, accuracy: "65.9", avgPredicted: "0.587", actualRate: "0.554", avgConfidence: "0.698", brierScore: "0.2412", calibrationError: "0.033" },
  },
  streaks: {
    current: {
      spx_direction: { type: "win", length: 4, startDate: "2026-02-03" },
      btc_direction: { type: "loss", length: 2, startDate: "2026-02-05" },
    },
    longest: {
      win: { outcome: "vix_spike", length: 12, startDate: "2026-01-15", endDate: "2026-01-26" },
      loss: { outcome: "major_quake", length: 8, startDate: "2026-01-02", endDate: "2026-01-09" },
    },
  },
  bestWorstPeriods: {
    windowDays: 7,
    best: { periodStart: "2026-01-20", periodEnd: "2026-01-26", accuracy: "82.4" },
    worst: { periodStart: "2026-01-08", periodEnd: "2026-01-14", accuracy: "48.2" },
  },
  byCategory: [
    { category: "market", total: 420, correct: 294, accuracy: "70.0" },
    { category: "cosmic", total: 312, correct: 196, accuracy: "62.8" },
    { category: "geophysical", total: 198, correct: 128, accuracy: "64.6" },
    { category: "sentiment", total: 150, correct: 94, accuracy: "62.7" },
  ],
  calibration: [
    { bucket: "0-10%", bucketMid: 5, total: 45, hits: 3, hitRate: "6.7", avgPredicted: "5.2", calibrationGap: "1.5" },
    { bucket: "10-20%", bucketMid: 15, total: 78, hits: 11, hitRate: "14.1", avgPredicted: "15.3", calibrationGap: "1.2" },
    { bucket: "20-30%", bucketMid: 25, total: 92, hits: 24, hitRate: "26.1", avgPredicted: "25.4", calibrationGap: "0.7" },
    { bucket: "30-40%", bucketMid: 35, total: 115, hits: 37, hitRate: "32.2", avgPredicted: "35.1", calibrationGap: "2.9" },
    { bucket: "40-50%", bucketMid: 45, total: 134, hits: 59, hitRate: "44.0", avgPredicted: "45.2", calibrationGap: "1.2" },
    { bucket: "50-60%", bucketMid: 55, total: 156, hits: 89, hitRate: "57.1", avgPredicted: "54.8", calibrationGap: "2.3" },
    { bucket: "60-70%", bucketMid: 65, total: 178, hits: 116, hitRate: "65.2", avgPredicted: "64.9", calibrationGap: "0.3" },
    { bucket: "70-80%", bucketMid: 75, total: 142, hits: 108, hitRate: "76.1", avgPredicted: "74.6", calibrationGap: "1.5" },
    { bucket: "80-90%", bucketMid: 85, total: 98, hits: 82, hitRate: "83.7", avgPredicted: "84.2", calibrationGap: "0.5" },
    { bucket: "90-100%", bucketMid: 95, total: 42, hits: 39, hitRate: "92.9", avgPredicted: "93.1", calibrationGap: "0.2" },
  ],
  trend: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const baseAccuracy = 65 + Math.sin(i / 5) * 8 + (Math.random() - 0.5) * 10;
    return {
      date: date.toISOString().split("T")[0],
      total: 36 + Math.floor(Math.random() * 12),
      correct: Math.floor((36 + Math.floor(Math.random() * 12)) * (baseAccuracy / 100)),
      accuracy: baseAccuracy.toFixed(1),
      brierScore: (0.25 - (baseAccuracy - 50) * 0.002).toFixed(4),
    };
  }),
};

// Custom tooltip component
interface TooltipPayload {
  value: number | string;
  name: string;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name}:{" "}
            <span className="font-mono">
              {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
              {entry.name.toLowerCase().includes("accuracy") || entry.name.toLowerCase().includes("rate") ? "%" : ""}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Stat card component
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-display font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
                trend === "neutral" && "text-muted-foreground"
              )}>
                {trend === "up" && <TrendingUp className="w-4 h-4" />}
                {trend === "down" && <TrendingDown className="w-4 h-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Rolling accuracy component
function RollingAccuracyCards({ rolling }: { rolling: DashboardData["rolling"] }) {
  const windows = [
    { key: "7d" as const, label: "7 Days", icon: Calendar },
    { key: "30d" as const, label: "30 Days", icon: Activity },
    { key: "90d" as const, label: "90 Days", icon: BarChart3 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {windows.map(({ key, label, icon }) => {
        const data = rolling[key];
        const accuracy = data.accuracy ? parseFloat(data.accuracy) : 0;
        const isGood = accuracy >= 60;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: windows.indexOf({ key, label, icon }) * 0.1 }}
          >
            <Card className={cn(
              "relative overflow-hidden",
              isGood ? "border-success/30" : "border-amber-500/30"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Badge
                    variant="outline"
                    className={cn(
                      isGood
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    )}
                  >
                    {isGood ? "Good" : "Needs Work"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold">
                        {data.accuracy || "—"}
                      </span>
                      <span className="text-xl text-muted-foreground">%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {data.correct} / {data.total} predictions
                    </p>
                  </div>

                  <Progress
                    value={accuracy}
                    className={cn(
                      "h-2",
                      isGood ? "[&>div]:bg-success" : "[&>div]:bg-amber-500"
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Brier Score</p>
                      <p className="font-mono text-sm">{data.brierScore || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Calibration</p>
                      <p className="font-mono text-sm">±{data.calibrationError || "—"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// Accuracy trend chart
function AccuracyTrendChart({ data }: { data: TrendPoint[] }) {
  const chartData = data.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    accuracy: d.accuracy ? parseFloat(d.accuracy) : 0,
    total: d.total,
    baseline: 50,
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Accuracy Trend</CardTitle>
        </div>
        <CardDescription>Daily prediction accuracy over the past 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                domain={[30, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={50}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                label={{ value: "Baseline", position: "right", fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#accuracyGradient)"
                name="Accuracy"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Calibration chart
function CalibrationChart({ data }: { data: CalibrationPoint[] }) {
  const chartData = data.map(d => ({
    bucket: d.bucket,
    bucketMid: d.bucketMid,
    hitRate: d.hitRate ? parseFloat(d.hitRate) : 0,
    predicted: d.avgPredicted ? parseFloat(d.avgPredicted) : 0,
    count: d.total,
    perfect: d.bucketMid,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Calibration Curve</CardTitle>
        </div>
        <CardDescription>How well predictions match actual outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="bucketMid"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                label={{ value: "Predicted Probability", position: "bottom", offset: -5 }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                label={{ value: "Actual Hit Rate", angle: -90, position: "insideLeft" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="linear"
                dataKey="perfect"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                dot={false}
                name="Perfect Calibration"
              />
              <Line
                type="monotone"
                dataKey="hitRate"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                name="Actual Hit Rate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Points close to the diagonal line indicate well-calibrated predictions
        </p>
      </CardContent>
    </Card>
  );
}

// Category accuracy chart
function CategoryAccuracyChart({ data }: { data: CategoryAccuracy[] }) {
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  const chartData = data.map((d, i) => ({
    category: d.category.charAt(0).toUpperCase() + d.category.slice(1),
    accuracy: d.accuracy ? parseFloat(d.accuracy) : 0,
    total: d.total,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Accuracy by Category</CardTitle>
        </div>
        <CardDescription>Performance breakdown by prediction type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
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
                dataKey="category"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]} name="Accuracy">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Streak cards
function StreakCards({ streaks }: { streaks: DashboardData["streaks"] }) {
  const { longest } = streaks;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-success/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-success" />
            <CardTitle className="text-sm font-medium">Best Winning Streak</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {longest.win ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-success">
                  {longest.win.length}
                </span>
                <span className="text-muted-foreground">correct in a row</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {longest.win.outcome.replace(/_/g, " ")} •{" "}
                {new Date(longest.win.startDate).toLocaleDateString()} -{" "}
                {new Date(longest.win.endDate).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No streak data available</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-destructive" />
            <CardTitle className="text-sm font-medium">Longest Losing Streak</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {longest.loss ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-display font-bold text-destructive">
                  {longest.loss.length}
                </span>
                <span className="text-muted-foreground">incorrect in a row</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {longest.loss.outcome.replace(/_/g, " ")} •{" "}
                {new Date(longest.loss.startDate).toLocaleDateString()} -{" "}
                {new Date(longest.loss.endDate).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No streak data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Best/worst periods
function BestWorstPeriods({ data }: { data: DashboardData["bestWorstPeriods"] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-success/30 bg-success/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <CardTitle className="text-sm font-medium">Best {data.windowDays}-Day Period</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {data.best ? (
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold text-success">
                {data.best.accuracy}%
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(data.best.periodStart).toLocaleDateString()} –{" "}
                {new Date(data.best.periodEnd).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-sm font-medium">Worst {data.windowDays}-Day Period</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {data.worst ? (
            <div className="space-y-1">
              <p className="text-3xl font-display font-bold text-destructive">
                {data.worst.accuracy}%
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(data.worst.periodStart).toLocaleDateString()} –{" "}
                {new Date(data.worst.periodEnd).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Current streaks grid
function CurrentStreaksGrid({ current }: { current: Record<string, Streak> }) {
  const outcomes = Object.entries(current);

  if (outcomes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No active streaks
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <CardTitle className="font-display">Current Streaks</CardTitle>
        </div>
        <CardDescription>Active winning and losing streaks by outcome</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {outcomes.map(([outcome, streak]) => (
            <motion.div
              key={outcome}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-3 rounded-lg border",
                streak.type === "win"
                  ? "border-success/30 bg-success/5"
                  : "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {streak.type === "win" ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className={cn(
                  "text-xl font-bold",
                  streak.type === "win" ? "text-success" : "text-destructive"
                )}>
                  {streak.length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {outcome.replace(/_/g, " ")}
              </p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main dashboard component
export function AnalyticsDashboard() {
  const [data, setData] = React.useState<DashboardData>(sampleData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      try {
        // Try to fetch from API
        const response = await fetch("/api/analytics/dashboard?days=90");
        if (response.ok) {
          const apiData = await response.json();
          setData(apiData);
        } else {
          // Use sample data if API fails
          console.log("Using sample data (API not available)");
        }
      } catch (err) {
        console.log("Using sample data (API not available)");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <section className="py-12 bg-muted/30">
      <div className="container px-4">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Activity className="w-4 h-4 mr-2" />
            Prediction Analytics
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
            Accuracy Dashboard
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Track prediction accuracy, calibration metrics, and performance trends
            over time. All metrics are calculated from verified predictions.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
            <TabsTrigger value="calibration">Calibration</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="90-Day Accuracy"
                value={`${data.rolling["90d"].accuracy || "—"}%`}
                subtitle={`${data.rolling["90d"].correct} / ${data.rolling["90d"].total}`}
                icon={Target}
                trend={parseFloat(data.rolling["7d"].accuracy || "0") > parseFloat(data.rolling["90d"].accuracy || "0") ? "up" : "down"}
                trendValue={`${(parseFloat(data.rolling["7d"].accuracy || "0") - parseFloat(data.rolling["90d"].accuracy || "0")).toFixed(1)}% vs 90d`}
              />
              <StatCard
                title="Brier Score"
                value={data.rolling["90d"].brierScore || "—"}
                subtitle="Lower is better"
                icon={BarChart3}
              />
              <StatCard
                title="Total Predictions"
                value={data.rolling["90d"].total.toLocaleString()}
                subtitle="Last 90 days"
                icon={Activity}
              />
              <StatCard
                title="Calibration Error"
                value={`±${data.rolling["90d"].calibrationError || "—"}`}
                subtitle="Prediction vs actual"
                icon={Target}
              />
            </div>

            {/* Rolling accuracy cards */}
            <RollingAccuracyCards rolling={data.rolling} />

            {/* Trend chart */}
            <AccuracyTrendChart data={data.trend} />

            {/* Category + Calibration */}
            <div className="grid lg:grid-cols-2 gap-6">
              <CategoryAccuracyChart data={data.byCategory} />
              <CalibrationChart data={data.calibration} />
            </div>
          </TabsContent>

          {/* Accuracy Tab */}
          <TabsContent value="accuracy" className="space-y-6">
            <RollingAccuracyCards rolling={data.rolling} />
            <AccuracyTrendChart data={data.trend} />
            <BestWorstPeriods data={data.bestWorstPeriods} />
            <CategoryAccuracyChart data={data.byCategory} />
          </TabsContent>

          {/* Calibration Tab */}
          <TabsContent value="calibration" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <CalibrationChart data={data.calibration} />
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">Understanding Calibration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Perfect calibration</strong> means when we
                    predict 70% probability, the event happens 70% of the time.
                  </p>
                  <p>
                    The <strong className="text-foreground">calibration curve</strong> shows how well
                    our predictions match reality. Points above the diagonal indicate
                    underconfidence; points below indicate overconfidence.
                  </p>
                  <p>
                    <strong className="text-foreground">Brier Score</strong> (0-1) measures both
                    calibration and discrimination. Lower is better. A score of 0.25 equals random
                    guessing for 50/50 outcomes.
                  </p>
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span>Current Calibration Error:</span>
                      <Badge variant="outline">
                        ±{data.rolling["90d"].calibrationError || "—"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calibration by bucket */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Calibration by Probability Bucket</CardTitle>
                <CardDescription>
                  Detailed breakdown of hit rates vs predicted probabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2">Bucket</th>
                        <th className="text-right py-2">Predictions</th>
                        <th className="text-right py-2">Hits</th>
                        <th className="text-right py-2">Hit Rate</th>
                        <th className="text-right py-2">Avg Predicted</th>
                        <th className="text-right py-2">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.calibration.map((row) => (
                        <tr key={row.bucket} className="border-b border-border/50">
                          <td className="py-2 font-mono">{row.bucket}</td>
                          <td className="text-right py-2">{row.total}</td>
                          <td className="text-right py-2">{row.hits}</td>
                          <td className="text-right py-2 font-mono">{row.hitRate}%</td>
                          <td className="text-right py-2 font-mono">{row.avgPredicted}%</td>
                          <td className="text-right py-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                parseFloat(row.calibrationGap || "0") <= 3
                                  ? "bg-success/10 text-success border-success/30"
                                  : parseFloat(row.calibrationGap || "0") <= 5
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                              )}
                            >
                              ±{row.calibrationGap}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Streaks Tab */}
          <TabsContent value="streaks" className="space-y-6">
            <StreakCards streaks={data.streaks} />
            <CurrentStreaksGrid current={data.streaks.current} />
            <BestWorstPeriods data={data.bestWorstPeriods} />
          </TabsContent>
        </Tabs>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </section>
  );
}
