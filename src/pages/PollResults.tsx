import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2, MessageSquare, BarChart3, Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPollWithQuestions, getPollResults, getComments, addComment, type Comment } from "@/lib/polls";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PollResults = () => {
  const { slug } = useParams();
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: pollData, isLoading: pollLoading } = useQuery({
    queryKey: ['poll', slug],
    queryFn: () => getPollWithQuestions(slug || ''),
    enabled: !!slug,
  });

  const { data: results } = useQuery({
    queryKey: ['results', pollData?.poll?.id],
    queryFn: () => getPollResults(pollData?.poll?.id || ''),
    enabled: !!pollData?.poll?.id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', pollData?.poll?.id],
    queryFn: () => getComments(pollData?.poll?.id || ''),
    enabled: !!pollData?.poll?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ body }: { body: string }) => 
      addComment(pollData?.poll?.id || '', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', pollData?.poll?.id] });
      setComment("");
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const poll = pollData?.poll;
  const questions = pollData?.questions || [];

  const handleShare = async () => {
    const url = window.location.href.replace('/results', '');
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = window.location.href.replace('/results', '');
    const text = `Check out this poll: ${poll?.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      addCommentMutation.mutate({ body: comment.trim() });
    }
  };

  // Calculate results for each question
  const calculateResults = (questionId: string, questionType: string) => {
    const questionAnswers = results?.answers?.filter((a: any) => a.question_id === questionId) || [];
    const question = questions.find((q) => q.id === questionId);
    const options = question?.options || [];

    if (['single_choice', 'multiple_choice'].includes(questionType)) {
      const counts: Record<string, number> = {};
      options.forEach((o) => { counts[o.label] = 0; });

      questionAnswers.forEach((a: any) => {
        if (a.value_text && counts[a.value_text] !== undefined) {
          counts[a.value_text]++;
        }
        if (a.value_json && Array.isArray(a.value_json)) {
          a.value_json.forEach((v: string) => {
            if (counts[v] !== undefined) counts[v]++;
          });
        }
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      return options.map((o) => ({
        label: o.label,
        count: counts[o.label] || 0,
        percent: Math.round((counts[o.label] / total) * 100),
      }));
    }

    if (questionType === 'rating') {
      const values = questionAnswers.map((a: any) => a.value_number).filter(Boolean);
      const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
      const distribution = [0, 0, 0, 0, 0];
      values.forEach((v: number) => { if (v >= 1 && v <= 5) distribution[v - 1]++; });
      const total = values.length || 1;
      return {
        average: avg.toFixed(1),
        distribution: distribution.map((d) => Math.round((d / total) * 100)),
      };
    }

    if (questionType === 'nps') {
      const values = questionAnswers.map((a: any) => a.value_number).filter((v: any) => v !== null);
      const total = values.length || 1;
      const detractors = values.filter((v: number) => v <= 6).length;
      const passives = values.filter((v: number) => v >= 7 && v <= 8).length;
      const promoters = values.filter((v: number) => v >= 9).length;
      const nps = Math.round(((promoters - detractors) / total) * 100);
      return {
        npsScore: nps,
        detractors: Math.round((detractors / total) * 100),
        passives: Math.round((passives / total) * 100),
        promoters: Math.round((promoters / total) * 100),
      };
    }

    if (questionType === 'emoji') {
      const emojis = question?.settings_json?.emojis || ["😍", "😊", "😐", "😕", "😢"];
      const counts: Record<string, number> = {};
      emojis.forEach((e: string) => { counts[e] = 0; });
      questionAnswers.forEach((a: any) => {
        if (a.value_text && counts[a.value_text] !== undefined) {
          counts[a.value_text]++;
        }
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      return emojis.map((e: string) => ({
        emoji: e,
        count: counts[e],
        percent: Math.round((counts[e] / total) * 100),
      }));
    }

    return null;
  };

  if (pollLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="font-display text-2xl font-semibold">Poll not found</h1>
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    );
  }

  const responseCount = results?.responseCount || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">A</span>
            </div>
            <span className="font-display font-bold">ASKANAI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Link
            </Button>
            <Button size="sm" className="btn-hero" onClick={handleWhatsAppShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
              <BarChart3 className="h-4 w-4" />
              {responseCount} response{responseCount !== 1 && 's'}
            </div>
            <h1 className="mb-2 font-display text-display-sm md:text-display-md">
              {poll.title}
            </h1>
            <p className="text-muted-foreground">Live results</p>
          </div>

          {/* Results */}
          <div className="space-y-8">
            {questions.map((question) => {
              const questionResults = calculateResults(question.id, question.type);

              if (question.type === 'single_choice' || question.type === 'multiple_choice') {
                return (
                  <div key={question.id} className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-6 font-display text-lg font-semibold">{question.prompt}</h3>
                    <div className="space-y-4">
                      {(questionResults as any[])?.map((r, i) => (
                        <div key={i}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-medium">{r.label}</span>
                            <span className="text-muted-foreground">{r.percent}%</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-700"
                              style={{ width: `${r.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (question.type === 'rating' && questionResults) {
                const r = questionResults as { average: string; distribution: number[] };
                return (
                  <div key={question.id} className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-6 font-display text-lg font-semibold">{question.prompt}</h3>
                    <div className="text-center">
                      <div className="mb-4 font-display text-5xl font-bold text-primary">
                        {r.average}
                      </div>
                      <p className="text-sm text-muted-foreground">Average rating out of 5</p>
                      <div className="mt-6 flex justify-center gap-1">
                        {r.distribution.map((percent, i) => (
                          <div key={i} className="w-12">
                            <div
                              className="mx-auto mb-2 w-8 rounded-t-sm bg-primary transition-all duration-500"
                              style={{ height: `${Math.max(4, percent * 2)}px` }}
                            />
                            <div className="text-xs text-muted-foreground">{i + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (question.type === 'nps' && questionResults) {
                const r = questionResults as { npsScore: number; detractors: number; passives: number; promoters: number };
                return (
                  <div key={question.id} className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-6 font-display text-lg font-semibold">{question.prompt}</h3>
                    <div className="text-center">
                      <div
                        className={cn(
                          "mb-2 font-display text-5xl font-bold",
                          r.npsScore >= 50
                            ? "text-success"
                            : r.npsScore >= 0
                            ? "text-warning"
                            : "text-destructive"
                        )}
                      >
                        {r.npsScore}
                      </div>
                      <p className="mb-6 text-sm text-muted-foreground">NPS Score</p>
                      <div className="flex justify-center gap-4 text-sm">
                        <div className="rounded-lg bg-destructive/10 px-4 py-2 text-destructive">
                          <div className="font-semibold">{r.detractors}%</div>
                          <div className="text-xs">Detractors</div>
                        </div>
                        <div className="rounded-lg bg-muted px-4 py-2">
                          <div className="font-semibold">{r.passives}%</div>
                          <div className="text-xs text-muted-foreground">Passives</div>
                        </div>
                        <div className="rounded-lg bg-success/10 px-4 py-2 text-success">
                          <div className="font-semibold">{r.promoters}%</div>
                          <div className="text-xs">Promoters</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              if (question.type === 'emoji' && questionResults) {
                return (
                  <div key={question.id} className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-6 font-display text-lg font-semibold">{question.prompt}</h3>
                    <div className="flex justify-center gap-6">
                      {(questionResults as any[]).map((r) => (
                        <div key={r.emoji} className="text-center">
                          <div className="mb-2 text-4xl">{r.emoji}</div>
                          <div className="font-semibold text-primary">{r.percent}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>

          {/* Comments */}
          {poll.allow_comments && (
            <div className="mt-12">
              <h2 className="mb-6 flex items-center gap-2 font-display text-xl font-semibold">
                <MessageSquare className="h-5 w-5" />
                Discussion ({comments.length})
              </h2>
              
              {/* Comment input */}
              <div className="mb-6 flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  className="flex-1"
                />
                <Button 
                  className="btn-hero" 
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || addCommentMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Comments list */}
              <div className="space-y-4">
                {comments.map((c: Comment) => (
                  <div key={c.id} className="rounded-xl border border-border/50 bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">{c.display_name || 'Anonymous'}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{c.body}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-muted-foreground">No comments yet. Be the first!</p>
                )}
              </div>
            </div>
          )}

          {/* Create your own */}
          <div className="mt-12 rounded-2xl bg-primary/5 p-8 text-center">
            <h3 className="mb-2 font-display text-lg font-semibold">
              Want to create your own poll?
            </h3>
            <p className="mb-4 text-muted-foreground">
              It takes less than 60 seconds to get started
            </p>
            <Link to="/create">
              <Button className="btn-hero">Create a Poll</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PollResults;
