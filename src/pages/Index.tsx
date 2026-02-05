import { Link } from "react-router-dom";
import { ArrowRight, Zap, Share2, BarChart3, Shield, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Create in 60 seconds",
    description: "Ultra-fast poll creation with all question types you need",
  },
  {
    icon: Share2,
    title: "Share instantly",
    description: "One-click sharing to WhatsApp, social media, or copy link",
  },
  {
    icon: BarChart3,
    title: "Real-time results",
    description: "Watch responses come in live with beautiful visualizations",
  },
  {
    icon: Shield,
    title: "Privacy controls",
    description: "Choose who sees results: public, voters only, or private",
  },
];

const questionTypes = [
  "Single choice",
  "Multiple choice",
  "Rating (1-5)",
  "NPS (0-10)",
  "Ranking",
  "Short text",
  "Emoji reaction",
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">A</span>
            </div>
            <span className="font-display text-xl font-bold">ASKANAI</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/create">
              <Button size="sm" className="btn-hero">
                Create Poll
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(168,76%,36%,0.08),transparent_50%)]" />
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Create polls in seconds
            </div>
            <h1 className="mb-6 font-display text-display-lg md:text-display-xl">
              The simplest way to{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                ask anything
              </span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground md:text-xl">
              Create beautiful polls and surveys in seconds. Share with anyone, anywhere.
              Get real-time insights that matter.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/create">
                <Button size="lg" className="btn-hero h-14 px-8 text-lg">
                  Create Your Poll
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                  See Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Question Types Ticker */}
      <section className="border-y border-border/50 bg-muted/30 py-6">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Question types:</span>
            {questionTypes.map((type) => (
              <span
                key={type}
                className="rounded-full bg-background px-3 py-1 text-sm font-medium shadow-sm"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-display-md">
              Everything you need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features wrapped in a simple experience
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section-subtle py-20 md:py-32">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 font-display text-display-md">How it works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to better decisions</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Create", desc: "Add your questions in seconds" },
              { step: "2", title: "Share", desc: "Send your poll link anywhere" },
              { step: "3", title: "Analyze", desc: "Watch results come in real-time" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl rounded-3xl bg-primary p-10 text-center md:p-16">
            <h2 className="mb-4 font-display text-display-sm text-primary-foreground md:text-display-md">
              Ready to start asking?
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Join thousands making better decisions with ASKANAI
            </p>
            <Link to="/create">
              <Button size="lg" className="btn-accent h-14 px-8 text-lg">
                Create Your First Poll
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="font-display text-sm font-bold text-primary-foreground">A</span>
              </div>
              <span className="font-display font-bold">ASKANAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 ASKANAI. The simplest poll platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
