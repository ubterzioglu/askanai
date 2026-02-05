import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, Users, MessageSquare } from "lucide-react";
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

  const startPoll = () => {
    navigate(`/p/${slug}/q/1`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="font-display text-2xl font-semibold">Poll not found</h1>
        <p className="text-muted-foreground">This poll doesn't exist or has been removed.</p>
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    );
  }

  const isClosed = poll.status === 'closed';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">A</span>
            </div>
            <span className="font-display font-bold">ASKANAI</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        <div className="question-container">
          <div className="w-full max-w-xl animate-slide-up space-y-8 text-center">
            {/* Status badge */}
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              isClosed 
                ? 'bg-muted text-muted-foreground' 
                : 'bg-success/10 text-success'
            }`}>
              <div className={`h-2 w-2 rounded-full ${isClosed ? 'bg-muted-foreground' : 'bg-success animate-pulse'}`} />
              {isClosed ? 'Closed' : 'Open for responses'}
            </div>

            {/* Title */}
            <div>
              <h1 className="mb-4 font-display text-display-sm md:text-display-md">
                {poll.title}
              </h1>
              {poll.description && (
                <p className="text-lg text-muted-foreground">{poll.description}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {questions.length} question{questions.length !== 1 && 's'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                ~{Math.max(1, Math.ceil(questions.length * 0.5))} min
              </div>
            </div>

            {/* CTA */}
            {isClosed ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">This poll is no longer accepting responses.</p>
                <Link to={`/p/${slug}/results`}>
                  <Button size="lg" className="btn-hero h-14 px-10 text-lg">
                    View Results
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Button onClick={startPoll} size="lg" className="btn-hero h-14 px-10 text-lg">
                  Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground">
                  Your responses are anonymous
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4">
        <div className="container text-center text-sm text-muted-foreground">
          Powered by <Link to="/" className="font-medium text-primary hover:underline">ASKANAI</Link>
        </div>
      </footer>
    </div>
  );
};

export default PollLanding;
