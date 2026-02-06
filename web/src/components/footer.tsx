"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ExternalLink,
  Github,
  Heart,
  Mail,
  Moon,
  Sun,
  Twitter,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  product: [
    { label: "Dashboard", href: "/" },
    { label: "Predictions", href: "/predictions" },
    { label: "Analytics", href: "/analytics" },
    { label: "API Access", href: "/api" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Methodology", href: "/methodology" },
    { label: "Data Sources", href: "/sources" },
    { label: "Research Papers", href: "/research" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
};

const dataSourceLinks = [
  { label: "NOAA Space Weather", href: "https://www.swpc.noaa.gov/" },
  { label: "GFZ Helmholtz", href: "https://www.gfz-potsdam.de/" },
  { label: "HeartMath Institute", href: "https://www.heartmath.org/" },
  { label: "NASA SDO", href: "https://sdo.gsfc.nasa.gov/" },
];

export function Footer() {
  const [email, setEmail] = React.useState("");

  return (
    <footer className="border-t border-border bg-muted/30" role="contentinfo">
      {/* Main Footer */}
      <div className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="What's Happening - Home">
              <div className="w-10 h-10 rounded-xl bg-gradient-cosmic flex items-center justify-center" aria-hidden="true">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">
                What&apos;s<span className="text-primary">Happening</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Data-driven predictions correlating cosmic events with real-world outcomes. 
              No mysticism—just observable correlations.
            </p>
            
            {/* Mini Newsletter */}
            <div className="space-y-3">
              <p className="text-sm font-medium" id="footer-subscribe-label">Quick Subscribe</p>
              <form className="flex gap-2" aria-labelledby="footer-subscribe-label">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                  aria-label="Email address for newsletter"
                />
                <Button size="sm" className="shrink-0" type="submit" aria-label="Subscribe to newsletter">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </Button>
              </form>
            </div>

            {/* Social Links */}
            <nav className="flex gap-2 mt-6" aria-label="Social media links">
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Follow us on Twitter">
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="View our GitHub">
                <Github className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Contact us via email">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>

          {/* Product Links */}
          <nav aria-label="Product links">
            <h3 className="font-display font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources Links */}
          <nav aria-label="Resources links">
            <h3 className="font-display font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company Links */}
          <nav aria-label="Company links">
            <h3 className="font-display font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal Links */}
          <nav aria-label="Legal links">
            <h3 className="font-display font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Data Sources */}
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Data Sources</h4>
            <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label="External data sources">
              {dataSourceLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {link.label}
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              ))}
            </nav>
          </div>
          
          {/* Live Status */}
          <div 
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border"
            role="status"
            aria-label="System status: All systems operational"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs text-muted-foreground">All systems operational</span>
            </div>
            <Separator orientation="vertical" className="h-4" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">
              <Activity className="w-3 h-3 inline mr-1" aria-hidden="true" />
              Last update: Just now
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              © {new Date().getFullYear()} What&apos;sHappening. Made with
              <Heart className="w-4 h-4 text-red-500 fill-red-500 inline mx-1" aria-hidden="true" />
              <span className="sr-only">love</span>
              for cosmic data enthusiasts.
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs">
                Predictions based on historical correlations. Not financial, medical, or professional advice.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
