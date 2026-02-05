import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      // Submit all answers
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Question not found</p>
        <Link to={`/p/${slug}`}>
          <Button variant="outline">Back to poll</Button>
        </Link>
      </div>
    );
  }

  // Get options from the question (from database or default for emoji/rating)
  const getQuestionOptions = (): string[] => {
    if (question.type === 'emoji') {
      return question.settings_json?.emojis || ["😍", "😊", "😐", "😕", "😢"];
    }
    return question.options?.map((o: Option) => o.label) || [];
  };

  const options = getQuestionOptions();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentQ + 1} of {totalQuestions}
          </span>
          <div className="w-16" />
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentQ + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </header>

      {/* Question area */}
      <main className="flex flex-1 flex-col">
        <div className="question-container animate-slide-up">
          <div className="w-full max-w-xl space-y-8">
            <div className="text-center">
              <p className="mb-2 text-sm font-medium text-primary">
                Question {currentQ + 1}
                {question.is_required && <span className="ml-1 text-destructive">*</span>}
              </p>
              <h1 className="font-display text-2xl font-semibold md:text-3xl">
                {question.prompt}
              </h1>
            </div>

            {/* Single Choice */}
            {question.type === "single_choice" && (
              <div className="space-y-3">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => setAnswer(option)}
                    className={cn(
                      "poll-option w-full text-left",
                      currentAnswer === option && "selected"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        currentAnswer === option
                          ? "border-primary bg-primary"
                          : "border-border"
                      )}
                    >
                      {currentAnswer === option && (
                        <Check className="h-4 w-4 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-base font-medium">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Multiple Choice */}
            {question.type === "multiple_choice" && (
              <div className="space-y-3">
                {options.map((option) => {
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
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors",
                          selected ? "border-primary bg-primary" : "border-border"
                        )}
                      >
                        {selected && <Check className="h-4 w-4 text-primary-foreground" />}
                      </div>
                      <span className="text-base font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Rating (1-5) */}
            {question.type === "rating" && (
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setAnswer(num)}
                    className={cn("rating-option", currentAnswer === num && "selected")}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            {/* NPS (0-10) */}
            {question.type === "nps" && (
              <div>
                <div className="mb-3 flex flex-wrap justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => setAnswer(num)}
                      className={cn(
                        "rating-option h-10 w-10 text-sm",
                        currentAnswer === num && "selected"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {/* Emoji */}
            {question.type === "emoji" && (
              <div className="flex justify-center gap-4">
                {options.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAnswer(emoji)}
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
                placeholder="Type your answer..."
                value={currentAnswer || ""}
                onChange={(e) => setAnswer(e.target.value)}
                className="input-floating text-center text-lg"
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-border/50 p-4">
          <div className="container flex justify-center">
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="btn-hero min-w-[200px]"
            >
              {currentQ === totalQuestions - 1 ? "Submit" : "Next"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PollQuestion;
