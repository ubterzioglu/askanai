import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface AskInputProps {
  onSubmit: (question: string) => void;
  placeholder?: string;
}

const placeholders = [
  "ask anything...",
  "hot take?",
  "be honest...",
  "what should we choose?",
  "rate this idea",
  "opinion?",
  "quick poll?",
  "help me decide",
];

export const AskInput = ({ onSubmit, placeholder }: AskInputProps) => {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        setIsAnimating(false);
      }, 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="ask-input pr-16"
          placeholder={placeholder || placeholders[currentPlaceholder]}
          style={{
            transition: isAnimating ? "opacity 0.2s" : "all 0.3s",
          }}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
          style={{
            boxShadow: value.trim() ? "0 0 20px hsl(201, 99%, 47%, 0.4)" : "none",
          }}
        >
          <ArrowRight className="h-6 w-6" />
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground opacity-60">
        press enter to create
      </p>
    </form>
  );
};
