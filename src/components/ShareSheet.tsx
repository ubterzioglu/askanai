import { Copy, Share2, ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pollUrl: string;
  pollTitle: string;
  onCreateAnother?: () => void;
}

export const ShareSheet = ({
  isOpen,
  onClose,
  pollUrl,
  pollTitle,
  onCreateAnother,
}: ShareSheetProps) => {
  if (!isOpen) return null;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(pollUrl);
    toast.success("Link copied! 🔗");
  };

  const handleWhatsAppShare = () => {
    const text = `${pollTitle}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + "\n" + pollUrl)}`,
      "_blank"
    );
  };

  const handleOpenResults = () => {
    window.open(`${pollUrl}/results`, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="share-sheet">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold">🎉 Poll created!</h3>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-primary/50 hover:bg-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Copy className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Copy link</p>
              <p className="text-sm text-muted-foreground truncate">{pollUrl}</p>
            </div>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-accent/50 hover:bg-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Share2 className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">Share on WhatsApp</p>
              <p className="text-sm text-muted-foreground">Send to friends</p>
            </div>
          </button>

          <button
            onClick={handleOpenResults}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 transition-all hover:border-warning/50 hover:bg-card"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-warning">
              <ExternalLink className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">View results</p>
              <p className="text-sm text-muted-foreground">Watch live responses</p>
            </div>
          </button>

          {onCreateAnother && (
            <button
              onClick={onCreateAnother}
              className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-border p-4 transition-all hover:border-muted-foreground/50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Plus className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-muted-foreground">Create another</p>
                <p className="text-sm text-muted-foreground">Start a new poll</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
};
