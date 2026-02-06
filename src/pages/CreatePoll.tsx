import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Check, HelpCircle, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TypeEmojiBar } from "@/components/TypeEmojiBar";
import { ShareSheet } from "@/components/ShareSheet";
import { createPoll } from "@/lib/polls";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setPreviewImage(file);
    // Create local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewImageUrl(localUrl);
  };

  const uploadPreviewImage = async (): Promise<string | null> => {
    if (!previewImage) return null;

    setIsUploadingImage(true);
    try {
      const fileExt = previewImage.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `previews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('poll-images')
        .upload(filePath, previewImage);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('poll-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removePreviewImage = () => {
    setPreviewImage(null);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const isQuestionComplete = (q: Question) =>
    q.prompt.trim() &&
    (!needsOptions(q.type) || q.options.filter((o) => o.trim()).length >= 2);

  const canPublish = questions.every(isQuestionComplete);

  const handlePublish = async () => {
    if (!canPublish) return;

    setIsSubmitting(true);
    try {
      // Upload preview image if selected
      let uploadedImageUrl: string | null = null;
      if (previewImage) {
        uploadedImageUrl = await uploadPreviewImage();
      }

      const result = await createPoll(
        questions[0].prompt, // Use first question as title
        null,
        questions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options.filter((o) => o.trim()),
          isRequired: true,
        })),
        { visibility, allowComments, previewImageUrl: uploadedImageUrl }
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
            className={cn(
              "h-10 w-28 text-sm transition-all",
              canPublish ? "btn-neon-green" : "btn-neon-orange"
            )}
          >
            {isSubmitting ? "..." : canPublish ? "Ready!" : "Not Ready!"}
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
              {questions.map((q, i) => {
                const complete = isQuestionComplete(q);
                const isActive = i === currentQuestionIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIndex(i)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                      isActive && "scale-110",
                      complete
                        ? isActive
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-[0_0_15px_hsl(var(--accent)/0.5)]"
                          : "bg-[hsl(var(--accent)/0.3)] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.5)]"
                        : isActive
                          ? "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] shadow-[0_0_15px_hsl(var(--warning)/0.5)]"
                          : "bg-[hsl(var(--warning)/0.3)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.5)]"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
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

          {/* Remove question button - pill style */}
          {questions.length > 1 && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  const newQuestions = questions.filter((_, i) => i !== currentQuestionIndex);
                  setQuestions(newQuestions);
                  setCurrentQuestionIndex(Math.min(currentQuestionIndex, newQuestions.length - 1));
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs text-muted-foreground border border-border/50 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <Trash2 className="h-3 w-3" />
                <span>remove this question</span>
              </button>
            </div>
          )}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? "hide" : "show"} settings ⚙️
          </button>

          {/* Advanced settings */}
          {showAdvanced && (
            <TooltipProvider delayDuration={200}>
              <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-6 animate-slide-up">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Results visibility</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">Controls who can see your poll results. Choose based on how private you want the data.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
                    {visibility === "public" && "🌍 Anyone can find and see results"}
                    {visibility === "unlisted" && "🔗 Only people with the link can access"}
                    {visibility === "voters" && "🗳️ Results visible only after voting"}
                    {visibility === "private" && "🔒 Only you can see the results"}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Allow comments</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">Let respondents leave comments after voting. Great for feedback!</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
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

                {/* Preview Image Upload */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Share preview image</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary cursor-help transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-sm">This image appears when you share your poll on social media (Twitter, Facebook, etc.)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  {previewImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img 
                        src={previewImageUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={removePreviewImage}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-border hover:border-primary/50 hover:text-primary transition-colors text-muted-foreground"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-sm">Choose image</span>
                    </button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    📸 Recommended: 1080×1080px (square works best!)
                  </p>
                </div>
              </div>
            </TooltipProvider>
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
