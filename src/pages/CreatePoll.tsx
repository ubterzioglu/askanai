import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Trash2, GripVertical, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPoll } from "@/lib/polls";
import { toast } from "sonner";

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
  isRequired: boolean;
}

const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  rating: "Rating (1-5)",
  nps: "NPS (0-10)",
  ranking: "Ranking",
  short_text: "Short Text",
  emoji: "Emoji Reaction",
};

const defaultEmojis = ["😍", "😊", "😐", "😕", "😢"];

const CreatePoll = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      type: "single_choice",
      prompt: "",
      options: ["", ""],
      isRequired: true,
    },
  ]);
  const [settings, setSettings] = useState<{
    visibility: "public" | "unlisted" | "voters" | "private";
    allowComments: boolean;
  }>({
    visibility: "public",
    allowComments: true,
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        type: "single_choice",
        prompt: "",
        options: ["", ""],
        isRequired: true,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === optionIndex ? value : opt)),
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.options.length > 2
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await createPoll(
        title,
        description || null,
        questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options.filter((o) => o.trim()),
          isRequired: q.isRequired,
        })),
        settings
      );

      if (result) {
        // Store creator key in localStorage for management
        localStorage.setItem(`poll-${result.poll.slug}-key`, result.creatorKey);
        toast.success("Poll created successfully!");
        navigate(`/p/${result.poll.slug}`);
      } else {
        toast.error("Failed to create poll. Please try again.");
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsOptions = (type: QuestionType) =>
    ["single_choice", "multiple_choice", "ranking"].includes(type);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
          </div>
          <div className="w-20" />
        </div>
        {/* Progress bar */}
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center">
                <h1 className="mb-2 font-display text-display-sm">Create your poll</h1>
                <p className="text-muted-foreground">Give your poll a name and description</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium">
                    Poll Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="What do you want to ask?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-floating h-14 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Add some context for your respondents..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-floating min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!title.trim()}
                  className="btn-hero"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Questions */}
          {step === 2 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center">
                <h1 className="mb-2 font-display text-display-sm">Add questions</h1>
                <p className="text-muted-foreground">Build your poll with different question types</p>
              </div>

              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <Select
                          value={question.type}
                          onValueChange={(value: QuestionType) =>
                            updateQuestion(question.id, { type: value })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(questionTypeLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {questions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(question.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Input
                        placeholder="Enter your question..."
                        value={question.prompt}
                        onChange={(e) =>
                          updateQuestion(question.id, { prompt: e.target.value })
                        }
                        className="input-floating"
                      />

                      {needsOptions(question.type) && (
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Options</Label>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                              <Input
                                placeholder={`Option ${optIndex + 1}`}
                                value={option}
                                onChange={(e) =>
                                  updateOption(question.id, optIndex, e.target.value)
                                }
                                className="flex-1"
                              />
                              {question.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(question.id, optIndex)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(question.id)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add option
                          </Button>
                        </div>
                      )}

                      {question.type === "emoji" && (
                        <div className="flex gap-2">
                          {defaultEmojis.map((emoji) => (
                            <div
                              key={emoji}
                              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl"
                            >
                              {emoji}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          checked={question.isRequired}
                          onCheckedChange={(checked) =>
                            updateQuestion(question.id, { isRequired: checked })
                          }
                        />
                        <Label className="text-sm text-muted-foreground">Required</Label>
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full border-dashed py-6"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add another question
                </Button>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={questions.some((q) => !q.prompt.trim())}
                  className="btn-hero"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {step === 3 && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center">
                <h1 className="mb-2 font-display text-display-sm">Poll settings</h1>
                <p className="text-muted-foreground">Configure visibility and options</p>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-start gap-4">
                    <Settings2 className="mt-1 h-5 w-5 text-primary" />
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-base font-medium">Who can see results?</Label>
                        <Select
                          value={settings.visibility}
                          onValueChange={(value: "public" | "unlisted" | "voters" | "private") =>
                            setSettings({ ...settings, visibility: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public - Everyone</SelectItem>
                            <SelectItem value="unlisted">Unlisted - Link holders only</SelectItem>
                            <SelectItem value="voters">Voters only - After voting</SelectItem>
                            <SelectItem value="private">Private - Only you</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">Allow comments</Label>
                          <p className="text-sm text-muted-foreground">
                            Let respondents discuss the poll
                          </p>
                        </div>
                        <Switch
                          checked={settings.allowComments}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, allowComments: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold">Summary</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {questions.length} question{questions.length !== 1 && "s"}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Results: {settings.visibility}
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Comments: {settings.allowComments ? "Enabled" : "Disabled"}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="btn-hero"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Publish Poll
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatePoll;
