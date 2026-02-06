import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { AskInput } from "@/components/AskInput";
import { LiveFeedBackground } from "@/components/LiveFeedBackground";
import { AuthModal } from "@/components/AuthModal";
import { UserMenu } from "@/components/UserMenu";
import { useTranslation } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

        {/* Bottom left accordion cards */}
        <div className="absolute bottom-6 left-6 z-10 hidden md:block max-w-xs animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Accordion type="single" collapsible className="space-y-2">
            {/* Where am I */}
            <AccordionItem value="where" className="glass-card rounded-xl border-0 overflow-hidden border-l-2 border-l-orange-400 bg-orange-500/20">
              <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline text-orange-100">
                {t('landing.whereAmI.title')}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{t('landing.whereAmI.line1')}</p>
                  <p>{t('landing.whereAmI.line2')}</p>
                  <p>{t('landing.whereAmI.line3')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Why sign up */}
            <AccordionItem value="why" className="glass-card rounded-xl border-0 overflow-hidden border-l-2 border-l-orange-400 bg-orange-500/20">
              <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline text-orange-100">
                {t('landing.whySignup.title')}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3">
                <div className="text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left font-normal pb-1">{t('landing.whySignup.feature')}</th>
                        <th className="text-center font-normal pb-1">{t('landing.whySignup.guest')}</th>
                        <th className="text-center font-normal pb-1">{t('landing.whySignup.member')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr>
                        <td className="py-0.5">{t('landing.whySignup.createPolls')}</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{t('landing.whySignup.vote')}</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{t('landing.whySignup.seeResults')}</td>
                        <td className="text-center">✅</td>
                        <td className="text-center">✅</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{t('landing.whySignup.managePolls')}</td>
                        <td className="text-center text-xs">{t('landing.whySignup.ifLinkLost')}</td>
                        <td className="text-center text-xs">{t('landing.whySignup.allSaved')}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{t('landing.whySignup.feelCool')}</td>
                        <td className="text-center">{t('landing.whySignup.meh')}</td>
                        <td className="text-center">{t('landing.whySignup.yes')}</td>
                      </tr>
                      <tr>
                        <td className="py-0.5">{t('landing.whySignup.price')}</td>
                        <td className="text-center">{t('landing.whySignup.free')}</td>
                        <td className="text-center">{t('landing.whySignup.free')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-2 text-muted-foreground/70">{t('landing.whySignup.note')}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Index;
