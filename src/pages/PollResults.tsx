import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2, Copy, Check, Send, RefreshCw } from "lucide-react";
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
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: pollData, isLoading: pollLoading } = useQuery({
    queryKey: ['poll', slug],
    queryFn: () => getPollWithQuestions(slug || ''),
    enabled: !!slug,
  });

  const { data: results, refetch: refetchResults } = useQuery({
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
      toast.success("comment added! 💬");
    },
    onError: () => {
      toast.error("failed to add comment");
    },
  });

  const poll = pollData?.poll;
  const questions = pollData?.questions || [];

  const handleShare = async () => {
    const url = window.location.href.replace('/results', '');
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("link copied! 🔗");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const url = window.location.href.replace('/results', '');
    const text = `${poll?.title}`;
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <div className="text-6xl">🤷</div>
        <h1 className="text-2xl font-bold">poll not found</h1>
        <Link to="/">
          <Button variant="outline" className="rounded-2xl">go home</Button>
        </Link>
      </div>
    );
  }

  const responseCount = results?.responseCount || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">A</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchResults()}
              className="text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button size="sm" className="btn-neon h-9 px-4 text-sm" onClick={handleWhatsAppShare}>
              <Share2 className="h-4 w-4 mr-2" />
              share
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        {/* Header */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
            <div className="pulse-dot" />
            <span>{responseCount} response{responseCount !== 1 && 's'}</span>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{poll.title}</h1>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {questions.map((question, qi) => {
            const questionResults = calculateResults(question.id, question.type);

            if (question.type === 'single_choice' || question.type === 'multiple_choice') {
              return (
                <div key={question.id} className="neon-card animate-slide-up" style={{ animationDelay: `${qi * 100}ms` }}>
                  <h3 className="mb-6 text-xl font-bold">{question.prompt}</h3>
                  <div className="space-y-4">
                    {(questionResults as any[])?.map((r, i) => (
                      <div key={i}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="font-medium">{r.label}</span>
                          <span className="text-primary font-bold">{r.percent}%</span>
                        </div>
                        <div className="result-bar">
                          <div
                            className="result-bar-fill"
                            style={{ 
                              width: `${r.percent}%`,
                              transition: 'width 1s ease-out',
                              transitionDelay: `${i * 100}ms`,
                            }}
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
                <div key={question.id} className="neon-card animate-slide-up" style={{ animationDelay: `${qi * 100}ms` }}>
                  <h3 className="mb-6 text-xl font-bold">{question.prompt}</h3>
                  <div className="text-center">
                    <div className="mb-2 text-6xl font-bold text-primary text-glow-blue">
                      {r.average}
                    </div>
                    <p className="text-sm text-muted-foreground">average rating out of 5</p>
                    <div className="mt-6 flex justify-center gap-2">
                      {r.distribution.map((percent, i) => (
                        <div key={i} className="text-center">
                          <div className="mx-auto mb-2 w-10 rounded-lg bg-primary/20 overflow-hidden">
                            <div 
                              className="w-full bg-primary transition-all duration-1000"
                              style={{ height: `${Math.max(4, percent * 1.5)}px` }}
                            />
                          </div>
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
                <div key={question.id} className="neon-card animate-slide-up" style={{ animationDelay: `${qi * 100}ms` }}>
                  <h3 className="mb-6 text-xl font-bold">{question.prompt}</h3>
                  <div className="text-center">
                    <div
                      className={cn(
                        "mb-2 text-6xl font-bold",
                        r.npsScore >= 50 ? "text-accent text-glow-green" : r.npsScore >= 0 ? "text-warning text-glow-yellow" : "text-destructive text-glow-orange"
                      )}
                    >
                      {r.npsScore}
                    </div>
                    <p className="mb-6 text-sm text-muted-foreground">NPS Score</p>
                    <div className="flex justify-center gap-3">
                      <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-destructive">
                        <div className="text-2xl font-bold">{r.detractors}%</div>
                        <div className="text-xs">detractors</div>
                      </div>
                      <div className="rounded-2xl bg-muted px-4 py-3">
                        <div className="text-2xl font-bold">{r.passives}%</div>
                        <div className="text-xs text-muted-foreground">passives</div>
                      </div>
                      <div className="rounded-2xl bg-accent/10 px-4 py-3 text-accent">
                        <div className="text-2xl font-bold">{r.promoters}%</div>
                        <div className="text-xs">promoters</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (question.type === 'emoji' && questionResults) {
              return (
                <div key={question.id} className="neon-card animate-slide-up" style={{ animationDelay: `${qi * 100}ms` }}>
                  <h3 className="mb-6 text-xl font-bold">{question.prompt}</h3>
                  <div className="flex justify-center gap-6">
                    {(questionResults as any[]).map((r, i) => (
                      <div key={r.emoji} className="text-center animate-bounce-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="mb-2 text-5xl">{r.emoji}</div>
                        <div className="text-xl font-bold text-primary">{r.percent}%</div>
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
          <div className="mt-12 animate-fade-in">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              💬 discussion ({comments.length})
            </h2>
            
            {/* Comment input */}
            <div className="mb-6 flex gap-2">
              <Input
                placeholder="add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                className="input-floating flex-1"
              />
              <Button 
                className="btn-neon h-auto px-6" 
                onClick={handleSubmitComment}
                disabled={!comment.trim() || addCommentMutation.isPending}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.map((c: Comment, i: number) => (
                <div 
                  key={c.id} 
                  className="comment-bubble animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold">{c.display_name || 'anon'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{c.body}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">no comments yet. be the first! 👀</p>
              )}
            </div>
          </div>
        )}

        {/* Create CTA */}
        <div className="mt-12 text-center">
          <Link to="/create">
            <Button className="btn-neon-green">
              create your own poll ✨
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PollResults;
