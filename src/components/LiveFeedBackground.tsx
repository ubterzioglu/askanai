import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface PollPreview {
  id: number;
  question: string;
  votes: number;
  color: "blue" | "green" | "orange" | "yellow";
}

const mockPolls: PollPreview[] = [
  { id: 1, question: "Best pizza topping?", votes: 234, color: "blue" },
  { id: 2, question: "Morning or night person?", votes: 567, color: "green" },
  { id: 3, question: "Rate this movie 🎬", votes: 189, color: "orange" },
  { id: 4, question: "iPhone or Android?", votes: 891, color: "yellow" },
  { id: 5, question: "Hot take: pineapple on pizza", votes: 445, color: "blue" },
  { id: 6, question: "What's your vibe today?", votes: 322, color: "green" },
  { id: 7, question: "Best coding language?", votes: 678, color: "orange" },
  { id: 8, question: "Coffee or tea? ☕", votes: 912, color: "yellow" },
];

const colorClasses = {
  blue: "border-primary/30 hover:border-primary/50",
  green: "border-accent/30 hover:border-accent/50",
  orange: "border-destructive/30 hover:border-destructive/50",
  yellow: "border-warning/30 hover:border-warning/50",
};

const dotColors = {
  blue: "bg-primary",
  green: "bg-accent",
  orange: "bg-destructive",
  yellow: "bg-warning",
};

export const LiveFeedBackground = () => {
  const [polls, setPolls] = useState<PollPreview[]>(mockPolls);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPolls((prev) =>
        prev.map((poll) => ({
          ...poll,
          votes: poll.votes + Math.floor(Math.random() * 5),
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Left column - hidden on mobile */}
      <div className="absolute left-[5%] top-0 hidden w-72 flex-col gap-4 opacity-20 animate-float md:flex" style={{ animationDelay: "0s" }}>
        {polls.slice(0, 4).map((poll, i) => (
          <div
            key={poll.id}
            className={cn(
              "feed-card border",
              colorClasses[poll.color]
            )}
            style={{ 
              animationDelay: `${i * 0.5}s`,
              transform: `translateY(${i * 20}px)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("h-2 w-2 rounded-full", dotColors[poll.color])} />
              <span className="text-xs text-muted-foreground">{poll.votes} votes</span>
            </div>
            <p className="text-sm font-medium truncate">{poll.question}</p>
          </div>
        ))}
      </div>

      {/* Right column - hidden on mobile */}
      <div className="absolute right-[5%] top-20 hidden w-72 flex-col gap-4 opacity-20 animate-float md:flex" style={{ animationDelay: "1s" }}>
        {polls.slice(4, 8).map((poll, i) => (
          <div
            key={poll.id}
            className={cn(
              "feed-card border",
              colorClasses[poll.color]
            )}
            style={{ 
              animationDelay: `${(i + 4) * 0.5}s`,
              transform: `translateY(${i * 20}px)`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("h-2 w-2 rounded-full", dotColors[poll.color])} />
              <span className="text-xs text-muted-foreground">{poll.votes} votes</span>
            </div>
            <p className="text-sm font-medium truncate">{poll.question}</p>
          </div>
        ))}
      </div>

      {/* Floating orbs - always visible but subtle */}
      <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
    </div>
  );
};
