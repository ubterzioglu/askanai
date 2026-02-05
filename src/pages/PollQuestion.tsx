import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPollWithQuestions, submitResponse, type Question, type Option } from "@/lib/polls";
import { useQuery } from "@tanstack/react-query";
import { SwipeCard } from "@/components/SwipeCard";

const PollQuestion = () => {
  const { slug, questionNum } = useParams();
  const navigate = useNavigate();
  const currentQ = parseInt(questionNum || "1") - 1;
  
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const saved = sessionStorage.getItem(`poll-${slug}-answers`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const currentAnswer = question ? answers[question.id] : undefined;

  const handleNext = async () => {
    if (currentQ < totalQuestions - 1) {
      navigate(`/p/${slug}/q/${currentQ + 2}`);
    } else if (poll) {
      setIsSubmitting(true);
      await submitResponse(poll.id, answers);
      sessionStorage.removeItem(`poll-${slug}-answers`);
      navigate(`/p/${slug}/results`);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      navigate(`/p/${slug}/q/${currentQ}`);
    } else {
      navigate(`/p/${slug}`);
    }
  };

  const setAnswer = (value: any) => {
    if (question) {
      setAnswers({ ...answers, [question.id]: value });
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
          <Button variant="outline" className="rounded-2xl">back to poll</Button>
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

  // Auto-advance for single selection types
  const handleOptionSelect = (value: any, autoAdvance: boolean = false) => {
    setAnswer(value);
    if (autoAdvance && canProceed) {
      setTimeout(() => {
        if (currentQ < totalQuestions - 1) {
          navigate(`/p/${slug}/q/${currentQ + 2}`);
        }
      }, 300);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress header */}
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
                  i === currentQ ? "w-8 bg-primary" : i < currentQ ? "w-4 bg-primary/50" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Question area */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-32">
        <div className="w-full max-w-lg animate-slide-up">
          {/* Question number */}
          <div className="mb-4 text-center">
            <span className="text-sm text-primary font-medium">
              {currentQ + 1}/{totalQuestions}
            </span>
          </div>

          {/* Question text */}
          <h1 className="mb-8 text-center text-3xl font-bold leading-tight md:text-4xl">
            {question.prompt}
            {question.is_required && (
              <span className="ml-1 text-destructive">*</span>
            )}
          </h1>

          {/* Single Choice */}
          {question.type === "single_choice" && (
            <div className="space-y-3">
              {options.map((option, i) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option, true)}
                  className={cn(
                    "poll-option w-full text-left",
                    currentAnswer === option && "selected"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border text-sm font-medium">
                    {currentAnswer === option ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </div>
                  <span className="flex-1 text-lg font-medium">{option}</span>
                </button>
              ))}
            </div>
          )}

          {/* Multiple Choice */}
          {question.type === "multiple_choice" && (
            <div className="space-y-3">
              {options.map((option, i) => {
                const selected = (currentAnswer || []).includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      const current = currentAnswer || [];
                      setAnswer(
                        selected
                          ? current.filter((o: string) => o !== option)
                          : [...current, option]
                      );
                    }}
                    className={cn("poll-option w-full text-left", selected && "selected")}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}>
                      {selected && <Check className="h-4 w-4" />}
                    </div>
                    <span className="flex-1 text-lg font-medium">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Rating (1-5) */}
          {question.type === "rating" && (
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleOptionSelect(num, true)}
                  className={cn(
                    "rating-option h-16 w-16 text-2xl",
                    currentAnswer === num && "selected"
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
                    onClick={() => handleOptionSelect(num, true)}
                    className={cn(
                      "rating-option h-12 w-12",
                      currentAnswer === num && "selected"
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

          {/* Emoji */}
          {question.type === "emoji" && (
            <div className="flex justify-center gap-4">
              {options.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleOptionSelect(emoji, true)}
                  className={cn("emoji-option", currentAnswer === emoji && "selected")}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Short Text */}
          {question.type === "short_text" && (
            <Input
              placeholder="type your answer..."
              value={currentAnswer || ""}
              onChange={(e) => setAnswer(e.target.value)}
              className="input-floating text-center text-xl"
              autoFocus
            />
          )}
        </div>
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            className="btn-neon min-w-[200px]"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : currentQ === totalQuestions - 1 ? (
              <>submit</>
            ) : (
              <>
                next
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PollQuestion;
