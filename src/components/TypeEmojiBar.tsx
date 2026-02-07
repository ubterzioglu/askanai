import { cn } from "@/lib/utils";

export type QuestionType = 
  | "single_choice" 
  | "multiple_choice" 
  | "rating" 
  | "rating_10"
  | "nps" 
  | "ranking" 
  | "short_text" 
  | "emoji";

interface TypeEmojiBarProps {
  selected: QuestionType;
  onChange: (type: QuestionType) => void;
}

const types: { type: QuestionType; emoji: string; label: string }[] = [
  { type: "single_choice", emoji: "⚪", label: "Single" },
  { type: "multiple_choice", emoji: "☑️", label: "Multi" },
  { type: "rating", emoji: "⭐", label: "1-5" },
  { type: "rating_10", emoji: "🌟", label: "1-10" },
  { type: "nps", emoji: "🔥", label: "NPS" },
  { type: "ranking", emoji: "🧠", label: "Rank" },
  { type: "short_text", emoji: "💬", label: "Text" },
  { type: "emoji", emoji: "😈", label: "Emoji" },
];

export const TypeEmojiBar = ({ selected, onChange }: TypeEmojiBarProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {types.map(({ type, emoji, label }) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "type-tab flex-col gap-0.5 h-auto w-auto px-3 py-2",
            selected === type && "selected"
          )}
        >
          <span className="text-lg">{emoji}</span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </button>
      ))}
    </div>
  );
};
