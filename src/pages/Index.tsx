import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AskInput } from "@/components/AskInput";
import { LiveFeedBackground } from "@/components/LiveFeedBackground";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { useTranslation } from "@/contexts/LanguageContext";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAsk = (question: string) => {
    navigate("/create", { state: { initialQuestion: question } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Live feed background */}
      <LiveFeedBackground />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header with login - top right */}
        <header className="flex items-center justify-end p-4">
          <UserMenu onLoginClick={() => setShowAuthModal(true)} />
        </header>

        {/* Hero - Central ask input */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 -mt-8">
          <div className="w-full max-w-2xl space-y-8 text-center animate-slide-up">
            {/* Tagline */}
            <div className="space-y-3">
              <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
                <span className="text-glow-blue">{t('landing.tagline')}</span>{" "}
                <span className="text-muted-foreground">{t('landing.taglineSuffix')}</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('landing.subtitle')}
              </p>
            </div>

            {/* Ask input */}
            <AskInput onSubmit={handleAsk} />

            {/* Social proof - minimal */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground opacity-50">
              <div className="flex items-center gap-2">
                <div className="pulse-dot" />
                <span>12.4k {t('landing.socialProof.pollsToday')}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span>89k {t('landing.socialProof.responses')}</span>
            </div>
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
