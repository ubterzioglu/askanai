import { useNavigate } from "react-router-dom";
import { AskInput } from "@/components/AskInput";
import { LiveFeedBackground } from "@/components/LiveFeedBackground";

const Index = () => {
  const navigate = useNavigate();

  const handleAsk = (question: string) => {
    // Navigate to create page with the question pre-filled
    navigate("/create", { state: { initialQuestion: question } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Live feed background */}
      <LiveFeedBackground />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header - minimal */}
        <header className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary animate-glow-pulse">
              <span className="font-display text-lg font-bold text-primary-foreground">A</span>
            </div>
            <span className="font-display text-xl font-bold tracking-tight">ASKANAI</span>
          </div>
        </header>

        {/* Hero - Central ask input */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
          <div className="w-full max-w-2xl space-y-8 text-center animate-slide-up">
            {/* Tagline */}
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                <span className="text-glow-blue">ask</span>{" "}
                <span className="text-muted-foreground">anything</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                throw a question into the internet
              </p>
              <p className="text-sm font-medium text-primary animate-pulse">
                ⚡ Create a poll in 10 seconds!
              </p>
            </div>

            {/* Ask input */}
            <AskInput onSubmit={handleAsk} />

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground opacity-60">
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span>12.4k polls today</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span>89k responses</span>
            </div>
          </div>
        </main>

        {/* Bottom hint */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <span className="text-lg">⚡</span>
            <span>create polls in seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
