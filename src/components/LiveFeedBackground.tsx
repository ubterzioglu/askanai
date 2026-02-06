import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingQuestion {
  id: number;
  question: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: "sm" | "md" | "lg";
}

const questions = [
  "Best pizza topping?",
  "Morning or night person?",
  "Rate this movie 🎬",
  "iPhone or Android?",
  "Hot take: pineapple on pizza",
  "What's your vibe today?",
  "Coffee or tea? ☕",
  "Cats or dogs?",
  "Beach or mountains?",
  "Early bird or night owl?",
  "Summer or winter?",
  "Netflix or YouTube?",
];

const generateFloatingQuestions = (): FloatingQuestion[] => {
  return questions.map((question, i) => ({
    id: i,
    question,
    x: Math.random() * 100,
    y: Math.random() * 100,
    speed: 15 + Math.random() * 25,
    opacity: 0.08 + Math.random() * 0.12,
    size: ["sm", "md", "lg"][Math.floor(Math.random() * 3)] as "sm" | "md" | "lg",
  }));
};

const sizeClasses = {
  sm: "text-xs md:text-sm",
  md: "text-sm md:text-base",
  lg: "text-base md:text-lg",
};

export const LiveFeedBackground = () => {
  const [floatingQuestions] = useState<FloatingQuestion[]>(generateFloatingQuestions);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Floating questions across entire screen */}
      {floatingQuestions.map((item) => (
        <div
          key={item.id}
          className={cn(
            "absolute whitespace-nowrap font-medium text-foreground animate-float-across",
            sizeClasses[item.size]
          )}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            opacity: item.opacity,
            animationDuration: `${item.speed}s`,
            animationDelay: `${-item.speed * (item.x / 100)}s`,
          }}
        >
          {item.question}
        </div>
      ))}

      {/* Gradient orbs for depth - spread across screen */}
      <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-accent/3 blur-3xl" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};