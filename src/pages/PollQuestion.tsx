import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPollWithQuestions, submitResponse, type Question, type Option } from "@/lib/polls";
import { useQuery } from "@tanstack/react-query";

const PollQuestion = () => {
  const { slug, questionNum } = useParams();
  const navigate = useNavigate();
  const currentQ = parseInt(questionNum || "1") - 1;
  
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const saved = sessionStorage.getItem(`poll-${slug}-answers`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tappedOption, setTappedOption] = useState<string | null>(null);

  const { data: pollData, isLoading, error } = useQuery({
    queryKey: ['poll', slug],
    queryFn: () => getPollWithQuestions(slug || ''),
    enabled: !!slug,
  });

  const poll = pollData?.poll;
  const questions = pollData?.questions || [];
  const question = questions[currentQ];
  const totalQuestions = questions.length;

  useEffect(() => {
    sessionStorage.setItem(`poll-${slug}-answers`, JSON.stringify(answers));
  }, [answers, slug]);

  // Reset tapped state when question changes
  useEffect(() => {
    setTappedOption(null);
  }, [currentQ]);

  const currentAnswer = question ? answers[question.id] : undefined;

  const handleTapSelect = (value: any, shouldAutoAdvance: boolean = true) => {
    if (!question) return;
    
    // Set the tapped option for visual feedback
    setTappedOption(String(value));
    setAnswers({ ...answers, [question.id]: value });

    // 0.4s micro feedback then auto-transition
    if (shouldAutoAdvance) {
      setTimeout(() => {
        if (currentQ < totalQuestions - 1) {
          navigate(`/p/${slug}/q/${currentQ + 2}`);
        } else {
          handleSubmit();
        }
      }, 400);
    }
  };

  const handleMultiSelect = (option: string) => {
    if (!question) return;
    const current = currentAnswer || [];
    const newValue = current.includes(option)
      ? current.filter((o: string) => o !== option)
      : [...current, option];
    setAnswers({ ...answers, [question.id]: newValue });
  };

  const handleSubmit = async () => {
    if (!poll) return;
    setIsSubmitting(true);
    await submitResponse(poll.id, answers);
    sessionStorage.removeItem(`poll-${slug}-answers`);
    navigate(`/p/${slug}/results`);
  };

  const handleBack = () => {
    if (currentQ > 0) {
      navigate(`/p/${slug}/q/${currentQ}`);
    } else {
      navigate(`/p/${slug}`);
    }
  };

  const canProceed = !question?.is_required || currentAnswer !== undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <div className="text-6xl">🤔</div>
        <p className="text-muted-foreground">question not found</p>
        <Link to={`/p/${slug}`}>
          <button className="rounded-2xl border border-border px-6 py-3 text-sm hover:bg-muted transition-colors">
            back to poll
          </button>
        </Link>
      </div>
    );
  }

  const getQuestionOptions = (): string[] => {
    if (question.type === 'emoji') {
      return question.settings_json?.emojis || ["😍", "😊", "😐", "😕", "😢"];
    }
    return question.options?.map((o: Option) => o.label) || [];
  };

  const options = getQuestionOptions();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentQ ? "w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" : i < currentQ ? "w-4 bg-primary/50" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Full screen question area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Question number */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary font-medium">
              {currentQ + 1} / {totalQuestions}
            </span>
          </div>

          {/* Question text - large and bold */}
          <h1 className="mb-10 text-center text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            {question.prompt}
            {question.is_required && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </h1>

          {/* Single Choice - Large tap targets */}
          {question.type === "single_choice" && (
            <div className="space-y-4">
              {options.map((option, i) => (
                <button
                  key={option}
                  onClick={() => handleTapSelect(option)}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200",
                    tappedOption === option 
                      ? "border-primary bg-primary/20 scale-[1.02] shadow-[0_0_30px_hsl(var(--primary)/0.4)]" 
                      : currentAnswer === option
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-card/60 hover:border-primary/30 hover:translate-x-1"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
                    tappedOption === option || currentAnswer === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}>
                    {tappedOption === option || currentAnswer === option ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </div>
                  <span className="flex-1 text-lg font-medium">{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* Multiple Choice - Toggle selection */}
          {question.type === "multiple_choice" && (
            <div className="space-y-4">
              {options.map((option, i) => {
                const selected = (currentAnswer || []).includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => handleMultiSelect(option)}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200",
                      selected
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                        : "border-border bg-card/60 hover:border-primary/30 hover:translate-x-1"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}>
                      {selected && <Check className="h-5 w-5" />}
                    </div>
                    <span className="flex-1 text-lg font-medium">{option}</span>
                  </button>
                );
              })}
              {/* Continue button for multiple choice */}
              {canProceed && (
                <button
                  onClick={() => {
                    if (currentQ < totalQuestions - 1) {
                      navigate(`/p/${slug}/q/${currentQ + 2}`);
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full mt-6 btn-neon"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : currentQ === totalQuestions - 1 ? (
                    "submit"
                  ) : (
                    "next →"
                  )}
                </button>
              )}
            </div>
          )}

          {/* Rating (1-5) - Large tap targets */}
          {question.type === "rating" && (
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleTapSelect(num)}
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition-all duration-200",
                    tappedOption === String(num)
                      ? "border-primary bg-primary text-primary-foreground scale-110 shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
                      : currentAnswer === num
                        ? "border-primary/50 bg-primary/20"
                        : "border-border hover:border-primary/30 hover:scale-105"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          )}

          {/* NPS (0-10) */}
          {question.type === "nps" && (
            <div>
              <div className="mb-4 flex flex-wrap justify-center gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleTapSelect(num)}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl border-2 text-base font-bold transition-all duration-200",
                      tappedOption === String(num)
                        ? "border-primary bg-primary text-primary-foreground scale-110 shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
                        : currentAnswer === num
                          ? "border-primary/50 bg-primary/20"
                          : "border-border hover:border-primary/30 hover:scale-105"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>not likely</span>
                <span>very likely</span>
              </div>
            </div>
          )}

          {/* Emoji - Large reaction buttons */}
          {question.type === "emoji" && (
            <div className="flex justify-center gap-4">
              {options.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleTapSelect(emoji)}
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full text-4xl transition-all duration-200",
                    tappedOption === emoji
                      ? "scale-125 bg-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
                      : currentAnswer === emoji
                        ? "scale-110 bg-primary/10"
                        : "bg-muted hover:scale-110 hover:bg-muted/80"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Short Text */}
          {question.type === "short_text" && (
            <div className="space-y-4">
              <Input
                placeholder="type your answer..."
                value={currentAnswer || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="input-floating text-center text-xl"
                autoFocus
              />
              {currentAnswer && (
                <button
                  onClick={() => {
                    if (currentQ < totalQuestions - 1) {
                      navigate(`/p/${slug}/q/${currentQ + 2}`);
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full btn-neon"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  ) : currentQ === totalQuestions - 1 ? (
                    "submit"
                  ) : (
                    "next →"
                  )}
                </button>
              )}
            </div>
          )}

          {/* Ranking type - would need drag/drop, simplified for now */}
          {question.type === "ranking" && (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground mb-4">Tap to rank (1 = best)</p>
              {options.map((option, i) => {
                const rankIndex = (currentAnswer || []).indexOf(option);
                const rank = rankIndex >= 0 ? rankIndex + 1 : null;
                return (
                  <button
                    key={option}
                    onClick={() => {
                      const current = currentAnswer || [];
                      if (current.includes(option)) {
                        setAnswers({ ...answers, [question.id]: current.filter((o: string) => o !== option) });
                      } else {
                        setAnswers({ ...answers, [question.id]: [...current, option] });
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200",
                      rank !== null
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/60 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold",
                      rank !== null
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    )}>
                      {rank !== null ? `#${rank}` : "-"}
                    </div>
                    <span className="flex-1 text-lg font-medium">{option}</span>
                  </button>
                );
              })}
              {(currentAnswer || []).length === options.length && (
                <button
                  onClick={() => {
                    if (currentQ < totalQuestions - 1) {
                      navigate(`/p/${slug}/q/${currentQ + 2}`);
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-full mt-4 btn-neon"
                >
                  {currentQ === totalQuestions - 1 ? "submit" : "next →"}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PollQuestion;
