import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPollWithQuestions } from "@/lib/polls";
import { useQuery } from "@tanstack/react-query";

const PollLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: pollData, isLoading, error } = useQuery({
    queryKey: ['poll', slug],
    queryFn: () => getPollWithQuestions(slug || ''),
    enabled: !!slug,
  });

  const poll = pollData?.poll;
  const questions = pollData?.questions || [];

  // Update OG meta tags when poll data loads
  useEffect(() => {
    if (!poll) return;

    // Update title
    document.title = `${poll.title} | ASKANAI`;

    // Update or create OG meta tags
    const updateMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMetaTag('og:title', poll.title);
    updateMetaTag('og:description', poll.description || 'Vote now on ASKANAI');
    updateMetaTag('og:type', 'website');
    
    if (poll.preview_image_url) {
      updateMetaTag('og:image', poll.preview_image_url);
    }

    // Twitter cards
    const updateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateTwitterMeta('twitter:title', poll.title);
    updateTwitterMeta('twitter:description', poll.description || 'Vote now on ASKANAI');
    if (poll.preview_image_url) {
      updateTwitterMeta('twitter:image', poll.preview_image_url);
    }

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = 'ASKANAI - Ask Anything';
    };
  }, [poll]);

  const startPoll = () => {
    navigate(`/p/${slug}/q/1`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
        <div className="text-6xl">🤷</div>
        <h1 className="text-2xl font-bold">poll not found</h1>
        <p className="text-muted-foreground">this poll doesn't exist or has been removed</p>
        <Link to="/">
          <Button variant="outline" className="rounded-2xl">go home</Button>
        </Link>
      </div>
    );
  }

  const isClosed = poll.status === 'closed';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
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
        {isClosed && (
          <Link to={`/p/${slug}/results`}>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              view results
            </Button>
          </Link>
        )}
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
        <div className="w-full max-w-lg space-y-8 text-center animate-slide-up">
          {/* Status */}
          {isClosed ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
              <span>⏹️</span>
              <span>closed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm text-accent">
              <div className="pulse-dot" />
              <span>live</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            {poll.title}
          </h1>

          {/* Description */}
          {poll.description && (
            <p className="text-lg text-muted-foreground">{poll.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            <span>~{Math.max(1, Math.ceil(questions.length * 0.5))} min</span>
          </div>

          {/* CTA */}
          {isClosed ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">this poll is no longer accepting responses</p>
              <Link to={`/p/${slug}/results`}>
                <Button className="btn-neon">
                  view results
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <Button onClick={startPoll} className="btn-neon h-16 px-12 text-xl">
                start
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <p className="text-sm text-muted-foreground opacity-60">
                anonymous • no login required
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <div className="p-4 text-center text-sm text-muted-foreground opacity-40">
        powered by <Link to="/" className="hover:text-primary transition-colors">ASKANAI</Link>
      </div>
    </div>
  );
};

export default PollLanding;
