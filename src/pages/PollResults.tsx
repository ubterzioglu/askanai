import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2, Copy, Check, Send, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getPollWithQuestions, getPollResults, getComments, addComment, getPollViewCount, type Comment } from "@/lib/polls";
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

  const { data: viewCount = 0 } = useQuery({
    queryKey: ['viewCount', pollData?.poll?.id],
    queryFn: () => getPollViewCount(pollData?.poll?.id || ''),
    enabled: !!pollData?.poll?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ body }: { body: string }) => 
      addComment(pollData?.poll?.id || '', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', pollData?.poll?.id] });
      setComment("");
      toast.success("comment added! ðŸ’¬");
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
    toast.success("link copied! ðŸ”—");
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

  // Results are aggregated server-side to avoid exposing raw per-response datasets.
  const getQuestionResults = (questionId: string) => {
    return results?.resultsByQuestionId?.[questionId] ?? null;
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
        <div className="text-6xl">ðŸ¤·</div>
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
          <Link to="/" className="group">
            <div className="relative flex h-12 w-12 items-center justify-center">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-lg transition-all duration-500 group-hover:bg-primary/40 group-hover:blur-xl" />
              {/* Pulsing ring */}
              <div className="absolute inset-1 rounded-full border border-primary/30 animate-pulse" />
              {/* Core */}
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-[0_0_15px_hsl(201,99%,47%,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_hsl(201,99%,47%,0.6)]">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchResults()}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: 'hsl(var(--destructive))',
                boxShadow: 'var(--glow-orange)',
              }}
            >
              <RefreshCw className="h-4 w-4 text-destructive-foreground" />
            </button>
            <button 
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: 'hsl(var(--warning))',
                boxShadow: 'var(--glow-yellow)',
              }}
            >
              {copied ? <Check className="h-4 w-4 text-warning-foreground" /> : <Copy className="h-4 w-4 text-warning-foreground" />}
            </button>
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
          <div className="mb-4 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              <div className="pulse-dot" />
              <span>{responseCount} oy</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
              <span>ðŸ‘ï¸ {viewCount} gÃ¶rÃ¼ntÃ¼leme</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{poll.title}</h1>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {questions.map((question, qi) => {
            const questionResults = getQuestionResults(question.id);

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
              const r = questionResults as { average: string; scale: number; distribution: number[] };
              const scale = r.scale || 5;
              return (
                <div key={question.id} className="neon-card animate-slide-up" style={{ animationDelay: `${qi * 100}ms` }}>
                  <h3 className="mb-6 text-xl font-bold">{question.prompt}</h3>
                  <div className="text-center">
                    <div className="mb-2 text-6xl font-bold text-primary text-glow-blue">
                      {r.average}
                    </div>
                    <p className="text-sm text-muted-foreground">average rating out of {scale}</p>
                    <div className={cn(
                      "mt-6 flex justify-center",
                      scale === 10 ? "flex-wrap gap-1.5" : "gap-2"
                    )}>
                      {r.distribution.map((percent, i) => (
                        <div key={i} className="text-center">
                          <div className={cn(
                            "mx-auto mb-2 rounded-lg bg-primary/20 overflow-hidden",
                            scale === 10 ? "w-7" : "w-10"
                          )}>
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
                  <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                    {(questionResults as any[]).map((r, i) => (
                      <div key={r.emoji} className="text-center animate-bounce-in min-w-[60px]" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="mb-2 text-4xl sm:text-5xl">{r.emoji}</div>
                        <div className="text-lg sm:text-xl font-bold text-primary">{r.percent}%</div>
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
              ðŸ’¬ discussion ({comments.length})
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
                <p className="text-center text-muted-foreground py-8">no comments yet. be the first! ðŸ‘€</p>
              )}
            </div>
          </div>
        )}

        {/* Create CTA */}
        <div className="mt-12 text-center">
          <Link to="/create">
            <Button className="btn-neon-green">
              create your own poll âœ¨
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PollResults;

