import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AskInput } from "@/components/AskInput";
import { LiveFeedBackground } from "@/components/LiveFeedBackground";
import { HelpCircle, UserCheck, UserX, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const [showComparison, setShowComparison] = useState(false);
  const [showWhereAmI, setShowWhereAmI] = useState(false);

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
              <p className="text-lg text-muted-foreground">
                ⚡ create a poll in 10 seconds
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

        {/* Floating info cards - bottom left */}
        <div className="fixed bottom-6 left-6 z-20 flex flex-col gap-2 max-w-xs">
          {/* Where am I? Card */}
          <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-md shadow-lg overflow-hidden">
            <button
              onClick={() => setShowWhereAmI(!showWhereAmI)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>where am i?</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showWhereAmI && "rotate-180")} />
            </button>
            {showWhereAmI && (
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2 animate-in slide-in-from-top-2">
                <p>
                  🎯 <strong>ASKANAI</strong> - create polls, share them, see results.
                </p>
                <p>
                  📱 Swipe like Tinder, fast like TikTok. Ask, share the link, done!
                </p>
                <p className="text-primary font-medium">
                  ✨ 100% free, no signup required.
                </p>
              </div>
            )}
          </div>

          {/* Comparison Card */}
          <div className="rounded-2xl border border-border/50 bg-card/90 backdrop-blur-md shadow-lg overflow-hidden">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
              title="to sign up, or not to sign up..."
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>to sign up or not to sign up 🎭</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showComparison && "rotate-180")} />
            </button>
            {showComparison && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                <div className="rounded-xl border border-border/50 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Feature</th>
                        <th className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <UserX className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Guest</span>
                          </div>
                        </th>
                        <th className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <UserCheck className="h-3 w-3 text-primary" />
                            <span className="text-primary">Signed up</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">Create polls</td>
                        <td className="px-3 py-2 text-center">✅</td>
                        <td className="px-3 py-2 text-center">✅</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">Vote</td>
                        <td className="px-3 py-2 text-center">✅</td>
                        <td className="px-3 py-2 text-center">✅</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">See results</td>
                        <td className="px-3 py-2 text-center">✅</td>
                        <td className="px-3 py-2 text-center">✅</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">Manage polls</td>
                        <td className="px-3 py-2 text-center text-muted-foreground/50">😢 if link is lost...</td>
                        <td className="px-3 py-2 text-center">✅ all saved</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">Feel cool</td>
                        <td className="px-3 py-2 text-center">😐 meh</td>
                        <td className="px-3 py-2 text-center">😎 yes</td>
                      </tr>
                      <tr className="border-t border-border/30 bg-primary/5">
                        <td className="px-3 py-2 font-medium text-foreground">Price</td>
                        <td className="px-3 py-2 text-center font-bold text-primary">🆓 FREE</td>
                        <td className="px-3 py-2 text-center font-bold text-primary">🆓 FREE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  💡 both are free, signup takes just 10 seconds
                </p>
              </div>
            )}
          </div>
        </div>

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
