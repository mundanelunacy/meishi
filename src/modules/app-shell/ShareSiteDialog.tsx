import {
  Copy,
  Facebook,
  Linkedin,
  Mail,
  Share2,
  Twitter,
  X,
} from "lucide-react";
import { Button } from "../../shared/ui/button";
import type { SiteShareLink } from "./siteShare";

type ShareSiteDialogProps = {
  onClose: () => void;
  onCopy: () => void;
  shareLinks: SiteShareLink[];
  url: string;
};

const shareLinkIcons = {
  Email: Mail,
  Facebook: Facebook,
  LinkedIn: Linkedin,
  X: Twitter,
} as const;

export function ShareSiteDialog({
  onClose,
  onCopy,
  shareLinks,
  url,
}: ShareSiteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-site-dialog-title"
    >
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-elevated">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="space-y-1">
            <h2 id="share-site-dialog-title" className="text-xl font-semibold">
              Share Meishi
            </h2>
            <p className="text-sm text-muted-foreground">
              Share the app link with a social app or copy it directly.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">App URL</p>
            <p className="break-all text-sm text-muted-foreground">{url}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {shareLinks.map((link) => {
              const Icon =
                shareLinkIcons[link.label as keyof typeof shareLinkIcons] ??
                Share2;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={
                    link.href.startsWith("mailto:") ? undefined : "_blank"
                  }
                  rel={
                    link.href.startsWith("mailto:") ? undefined : "noreferrer"
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCopy}>
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
            <Button type="button" onClick={onClose}>
              <Share2 className="h-4 w-4" />
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
