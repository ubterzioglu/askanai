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
        {/* Header - reduced spacer */}
        <header className="p-3" />

        {/* Hero - Central ask input */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 -mt-16">
          <div className="w-full max-w-2xl space-y-8 text-center animate-slide-up">
            {/* Tagline */}
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                <span className="text-glow-blue">ask</span>{" "}
                <span className="text-muted-foreground">anything</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                create a poll in 10 seconds
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

        {/* Floating info cards - bottom left, above logo */}
        <div className="fixed bottom-20 left-6 z-20 flex flex-col gap-2 max-w-xs">
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
              <div className="px-4 pb-4 text-sm text-muted-foreground space-y-1 animate-in slide-in-from-top-2">
                <p>🎯 create polls, share, see results</p>
                <p>📱 swipe to vote, fast & fun</p>
                <p className="text-primary font-medium">✨ 100% free, no signup</p>
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
                <span>why sign up?</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showComparison && "rotate-180")} />
            </button>
            {showComparison && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                <div className="rounded-xl border border-border/50 overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">feature</th>
                        <th className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <UserX className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">guest</span>
                          </div>
                        </th>
                        <th className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <UserCheck className="h-3 w-3 text-primary" />
                            <span className="text-primary">member</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">create polls</td>
                        <td className="px-3 py-2 text-center">✅</td>
                        <td className="px-3 py-2 text-center">✅</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">vote</td>
                        <td className="px-3 py-2 text-center">✅</td>
                        <td className="px-3 py-2 text-center">✅</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">see results</td>
                        <td className="px-3 py-2 text-center">✅</td>
                        <td className="px-3 py-2 text-center">✅</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">manage polls</td>
                        <td className="px-3 py-2 text-center text-muted-foreground/50">😢 if link lost</td>
                        <td className="px-3 py-2 text-center">✅ all saved</td>
                      </tr>
                      <tr className="border-t border-border/30">
                        <td className="px-3 py-2">feel cool</td>
                        <td className="px-3 py-2 text-center">😐 meh</td>
                        <td className="px-3 py-2 text-center">😎 yes</td>
                      </tr>
                      <tr className="border-t border-border/30 bg-primary/5">
                        <td className="px-3 py-2 font-medium text-foreground">price</td>
                        <td className="px-3 py-2 text-center font-bold text-primary">🆓 free</td>
                        <td className="px-3 py-2 text-center font-bold text-primary">🆓 free</td>
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
      </div>
    </div>
  );
};

export default Index;
