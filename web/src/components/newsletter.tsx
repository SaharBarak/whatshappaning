"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Bell, 
  Check, 
  Loader2, 
  Mail, 
  Sparkles,
  Zap 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Newsletter() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [preferences, setPreferences] = React.useState({
    daily: true,
    weekly: false,
    alerts: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Simulate success
    setStatus("success");
    setEmail("");
    
    // Reset after 3 seconds
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-cosmic opacity-90" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge 
              variant="outline" 
              className="mb-6 bg-white/10 text-white border-white/20"
            >
              <Mail className="w-4 h-4 mr-2" />
              Stay Informed
            </Badge>

            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Get Daily Predictions
            </h2>
            <p className="text-white/80 mb-8">
              Receive personalized predictions based on cosmic data correlations,
              delivered straight to your inbox every morning.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input Group */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading" || status === "success"}
                    className={cn(
                      "h-14 pl-12 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/50",
                      "focus:bg-white/20 focus:border-white/40 focus-visible:ring-white/30"
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!email || status === "loading" || status === "success"}
                  className={cn(
                    "h-14 px-8 text-base font-semibold transition-all duration-300",
                    status === "success" 
                      ? "bg-green-500 hover:bg-green-500" 
                      : "bg-white text-primary hover:bg-white/90"
                  )}
                >
                  {status === "loading" && (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  )}
                  {status === "success" && (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  {status === "idle" && (
                    <Zap className="w-5 h-5 mr-2" />
                  )}
                  {status === "loading" 
                    ? "Subscribing..." 
                    : status === "success" 
                    ? "Subscribed!" 
                    : "Subscribe"
                  }
                </Button>
              </div>

              {/* Preferences */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.daily}
                    onChange={(e) => setPreferences({ ...preferences, daily: e.target.checked })}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-white/30"
                  />
                  Daily digest
                </label>
                <label className="flex items-center gap-2 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.weekly}
                    onChange={(e) => setPreferences({ ...preferences, weekly: e.target.checked })}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-white/30"
                  />
                  Weekly summary
                </label>
                <label className="flex items-center gap-2 text-white/80 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.alerts}
                    onChange={(e) => setPreferences({ ...preferences, alerts: e.target.checked })}
                    className="w-4 h-4 rounded border-white/30 bg-white/10 text-primary focus:ring-white/30"
                  />
                  Pattern alerts
                </label>
              </div>
            </form>

            {/* Success Message */}
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30"
              >
                <p className="text-green-300 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Welcome aboard! Check your inbox to confirm.
                </p>
              </motion.div>
            )}

            {/* Features */}
            <div className="mt-12 grid sm:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Daily Insights", desc: "Personalized predictions" },
                { icon: Bell, title: "Instant Alerts", desc: "Pattern notifications" },
                { icon: Sparkles, title: "Exclusive Data", desc: "Members-only analysis" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <feature.icon className="w-6 h-6 text-white/80 mx-auto mb-2" />
                  <h3 className="font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-white/60">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
