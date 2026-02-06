import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypeEmojiBar } from "@/components/TypeEmojiBar";
import { ShareSheet } from "@/components/ShareSheet";
import { createPoll } from "@/lib/polls";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type QuestionType = 
  | "single_choice" 
  | "multiple_choice" 
  | "rating" 
  | "nps" 
  | "ranking" 
  | "short_text" 
  | "emoji";

interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
}

const CreatePoll = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuestion = location.state?.initialQuestion || "";

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      type: "single_choice",
      prompt: initialQuestion,
      options: ["", ""],
    },
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "voters" | "private">("public");
  const [allowComments, setAllowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [createdPollUrl, setCreatedPollUrl] = useState("");
  const [createdPollTitle, setCreatedPollTitle] = useState("");

  const currentQuestion = questions[currentQuestionIndex];

  const updateCurrentQuestion = (updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === currentQuestionIndex ? { ...q, ...updates } : q))
    );
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    updateCurrentQuestion({ options: newOptions });
  };

  const addOption = () => {
    updateCurrentQuestion({ options: [...currentQuestion.options, ""] });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      updateCurrentQuestion({
        options: currentQuestion.options.filter((_, i) => i !== index),
      });
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "single_choice",
        prompt: "",
        options: ["", ""],
      },
    ]);
    setCurrentQuestionIndex(questions.length);
  };

  const needsOptions = (type: QuestionType) =>
    ["single_choice", "multiple_choice", "ranking"].includes(type);

  const canPublish = questions.every(
    (q) =>
      q.prompt.trim() &&
      (!needsOptions(q.type) || q.options.filter((o) => o.trim()).length >= 2)
  );

  const handlePublish = async () => {
    if (!canPublish) return;

    setIsSubmitting(true);
    try {
      const result = await createPoll(
        questions[0].prompt, // Use first question as title
        null,
        questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options.filter((o) => o.trim()),
          isRequired: true,
        })),
        { visibility, allowComments }
      );

      if (result) {
        localStorage.setItem(`poll-${result.poll.slug}-key`, result.creatorKey);
        const baseUrl = window.location.origin;
        setCreatedPollUrl(`${baseUrl}/p/${result.poll.slug}`);
        setCreatedPollTitle(result.poll.title);
        setShowShareSheet(true);
      } else {
        toast.error("Failed to create poll");
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === currentQuestion.options.length - 1) {
        addOption();
        // Focus the new input after render
        setTimeout(() => {
          const inputs = document.querySelectorAll('[data-option-input]');
          const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
          lastInput?.focus();
        }, 0);
      } else {
        // Focus next input
        const inputs = document.querySelectorAll('[data-option-input]');
        const nextInput = inputs[index + 1] as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
          <Button
            onClick={handlePublish}
            disabled={!canPublish || isSubmitting}
            className="btn-neon h-10 px-6 text-sm"
          >
            {isSubmitting ? "..." : "Publish"}
          </Button>
        </div>
      </header>

      <main className="container max-w-xl py-8">
        <div className="space-y-8 animate-fade-in">
          {/* Question input */}
          <div className="space-y-4">
            <input
              type="text"
              value={currentQuestion.prompt}
              onChange={(e) => updateCurrentQuestion({ prompt: e.target.value })}
              placeholder="type your question..."
              className="w-full bg-transparent text-3xl font-bold placeholder:text-muted-foreground/40 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Type selector */}
          <TypeEmojiBar
            selected={currentQuestion.type}
            onChange={(type) => updateCurrentQuestion({ type })}
          />

          {/* Options (for choice types) */}
          {needsOptions(currentQuestion.type) && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="group flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm text-muted-foreground">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <Input
                    data-option-input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    onKeyDown={(e) => handleOptionKeyDown(e, index)}
                    placeholder={`option ${index + 1}`}
                    className="flex-1 border-0 border-b border-border/50 bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-primary rounded-none"
                  />
                  {currentQuestion.options.length > 2 && (
                    <button
                      onClick={() => removeOption(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addOption}
                className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">add option</span>
              </button>
            </div>
          )}

          {/* Rating preview */}
          {currentQuestion.type === "rating" && (
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="rating-option">
                  {num}
                </div>
              ))}
            </div>
          )}

          {/* NPS preview */}
          {currentQuestion.type === "nps" && (
            <div className="flex flex-wrap justify-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div key={num} className="rating-option h-10 w-10 text-sm">
                  {num}
                </div>
              ))}
            </div>
          )}

          {/* Emoji preview */}
          {currentQuestion.type === "emoji" && (
            <div className="flex justify-center gap-4">
              {["😍", "😊", "😐", "😕", "😢"].map((emoji) => (
                <div key={emoji} className="emoji-option">
                  {emoji}
                </div>
              ))}
            </div>
          )}

          {/* Text input preview */}
          {currentQuestion.type === "short_text" && (
            <div className="input-floating text-center text-muted-foreground">
              respondents will type here...
            </div>
          )}

          {/* Multiple questions nav */}
          {questions.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestionIndex(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i === currentQuestionIndex
                      ? "w-6 bg-primary"
                      : "bg-muted hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Add question button */}
          <button
            onClick={addQuestion}
            className="w-full rounded-2xl border border-dashed border-border py-4 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            <Plus className="inline h-5 w-5 mr-2" />
            add question
          </button>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? "hide" : "show"} settings ⚙️
          </button>

          {/* Advanced settings */}
          {showAdvanced && (
            <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-6 animate-slide-up">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Results visibility</span>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="voters">Voters only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibility === "public" && "Herkes anketi bulabilir ve sonuçları görebilir"}
                  {visibility === "unlisted" && "Sadece linke sahip olanlar anketi ve sonuçları görebilir"}
                  {visibility === "voters" && "Sadece oy verenler sonuçları görebilir"}
                  {visibility === "private" && "Sadece sen sonuçları görebilirsin"}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Allow comments</span>
                <button
                  onClick={() => setAllowComments(!allowComments)}
                  className={cn(
                    "h-6 w-11 rounded-full transition-colors",
                    allowComments ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-white transition-transform",
                      allowComments ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Share sheet */}
      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => {
          setShowShareSheet(false);
          navigate(`/p/${createdPollUrl.split("/p/")[1]}`);
        }}
        pollUrl={createdPollUrl}
        pollTitle={createdPollTitle}
        onCreateAnother={() => {
          setShowShareSheet(false);
          setQuestions([
            {
              id: crypto.randomUUID(),
              type: "single_choice",
              prompt: "",
              options: ["", ""],
            },
          ]);
          setCurrentQuestionIndex(0);
        }}
      />
    </div>
  );
};

export default CreatePoll;
