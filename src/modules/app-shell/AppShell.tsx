import { useEffect, useRef, useState, type TouchEvent } from "react";
import { usePostHog } from "@posthog/react";
import { defineMessages, useIntl } from "react-intl";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Camera,
  Coffee,
  ContactRound,
  Github,
  BookOpen,
  Menu,
  ScanSearch,
  Share2,
  Settings,
  X,
} from "lucide-react";
import { LOCALE_LABELS } from "../../app/intl";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { pushToast } from "../../shared/ui/toastBus";
import {
  selectAppReadiness,
  selectLocale,
  setLocale,
} from "../onboarding-settings/onboardingSlice";
import { Button } from "../../shared/ui/button";
import { usePwaLifecycle } from "../pwa-runtime";
import { getPrimarySwipeDestination } from "./navigation";
import { ShareSiteDialog } from "./ShareSiteDialog";
import {
  buildSiteShareLinks,
  copySiteShareUrl,
  getAppShareUrl,
  isShareCancellationError,
  shareSiteUrl,
} from "./siteShare";

const messages = defineMessages({
  navCapture: {
    id: "shell.nav.capture",
    defaultMessage: "Capture",
  },
  navReview: {
    id: "shell.nav.review",
    defaultMessage: "Review",
  },
  navSettings: {
    id: "shell.nav.settings",
    defaultMessage: "Settings",
  },
  navGoogleContacts: {
    id: "shell.nav.googleContacts",
    defaultMessage: "Google Contacts",
  },
  navDocs: {
    id: "shell.nav.docs",
    defaultMessage: "Docs",
  },
  navShare: {
    id: "shell.nav.share",
    defaultMessage: "Share",
  },
  navCoffee: {
    id: "shell.nav.coffee",
    defaultMessage: "Buy Me a Coffee",
  },
  navGithub: {
    id: "shell.nav.github",
    defaultMessage: "GitHub",
  },
  openNavigationMenu: {
    id: "shell.menu.openNavigation",
    defaultMessage: "Open navigation menu",
  },
  moreNavigation: {
    id: "shell.menu.moreNavigation",
    defaultMessage: "More navigation",
  },
  selectLanguageDesktop: {
    id: "shell.languagePicker.desktop",
    defaultMessage: "Select language (desktop)",
  },
  selectLanguageMobile: {
    id: "shell.languagePicker.mobile",
    defaultMessage: "Select language (mobile)",
  },
  primaryNavigation: {
    id: "shell.navigation.primary",
    defaultMessage: "Primary navigation",
  },
  primaryNavigationToggle: {
    id: "shell.navigation.primaryToggle",
    defaultMessage: "Primary navigation toggle",
  },
  unableNativeShare: {
    id: "shell.toast.unableNativeShare",
    defaultMessage: "Unable to open the native share sheet.",
  },
  copiedLink: {
    id: "shell.toast.copiedLink",
    defaultMessage: "Link copied to clipboard.",
  },
  unableCopyLink: {
    id: "shell.toast.unableCopyLink",
    defaultMessage: "Unable to copy the link.",
  },
  updateAvailableBanner: {
    id: "shell.banner.updateAvailable",
    defaultMessage: "A new version is available.",
  },
  updateButton: {
    id: "shell.banner.updateButton",
    defaultMessage: "Update",
  },
  offlineReadyBanner: {
    id: "shell.banner.offlineReady",
    defaultMessage:
      "Offline shell cached. Extraction and sync still need a connection.",
  },
  dismiss: {
    id: "shell.banner.dismiss",
    defaultMessage: "Dismiss",
  },
  installBanner: {
    id: "shell.banner.install",
    defaultMessage: "Install Meishi for faster access.",
  },
  installButton: {
    id: "shell.banner.installButton",
    defaultMessage: "Install",
  },
  shareTitle: {
    id: "shell.share.title",
    defaultMessage: "Meishi",
  },
  shareText: {
    id: "shell.share.text",
    defaultMessage:
      "Scan business cards and keep contact details organized with Meishi.",
  },
  shareFacebook: {
    id: "shell.share.facebook",
    defaultMessage: "Facebook",
  },
  shareX: {
    id: "shell.share.x",
    defaultMessage: "X",
  },
  shareLinkedIn: {
    id: "shell.share.linkedIn",
    defaultMessage: "LinkedIn",
  },
  shareEmail: {
    id: "shell.share.email",
    defaultMessage: "Email",
  },
});

function getPrimaryNavItems(intl: ReturnType<typeof useIntl>) {
  return [
    {
      type: "internal",
      to: "/capture",
      label: intl.formatMessage(messages.navCapture),
      icon: Camera,
    },
    {
      type: "internal",
      to: "/review",
      label: intl.formatMessage(messages.navReview),
      icon: ScanSearch,
    },
  ] as const;
}

function getOverflowNavItems(intl: ReturnType<typeof useIntl>) {
  return [
    {
      type: "internal",
      to: "/settings",
      label: intl.formatMessage(messages.navSettings),
      icon: Settings,
    },
    {
      type: "external",
      href: "https://contacts.google.com/",
      label: intl.formatMessage(messages.navGoogleContacts),
      icon: ContactRound,
    },
    {
      type: "internal",
      to: "/docs",
      label: intl.formatMessage(messages.navDocs),
      icon: BookOpen,
    },
    {
      type: "action",
      action: "share-site",
      label: intl.formatMessage(messages.navShare),
      icon: Share2,
    },
    {
      type: "external",
      href: "https://buymeacoffee.com/mundanelunacy",
      label: intl.formatMessage(messages.navCoffee),
      menuLabel: intl.formatMessage(messages.navCoffee),
      icon: Coffee,
    },
    {
      type: "external",
      href: "https://github.com/mundanelunacy/meishi",
      label: intl.formatMessage(messages.navGithub),
      icon: Github,
    },
  ] as const;
}

const CHROMELESS_PATHS = new Set(["/auth/google/callback"]);

export function AppShell() {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isChromelessRoute = CHROMELESS_PATHS.has(pathname);
  const readiness = useAppSelector(selectAppReadiness);
  const locale = useAppSelector(selectLocale);
  const {
    applyUpdate,
    canInstall,
    dismissOfflineReady,
    isInstalled,
    needRefresh,
    offlineReady,
    promptInstall,
  } = usePwaLifecycle();
  const posthog = usePostHog();
  const [openMenu, setOpenMenu] = useState<"desktop" | "mobile" | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const shareUrl = getAppShareUrl();
  const primaryNavItems = getPrimaryNavItems(intl);
  const overflowNavItems = getOverflowNavItems(intl);
  const shareCopy = {
    title: intl.formatMessage(messages.shareTitle),
    text: intl.formatMessage(messages.shareText),
    labels: {
      facebook: intl.formatMessage(messages.shareFacebook),
      x: intl.formatMessage(messages.shareX),
      linkedIn: intl.formatMessage(messages.shareLinkedIn),
      email: intl.formatMessage(messages.shareEmail),
    },
  };
  const shareLinks = buildSiteShareLinks(shareUrl, shareCopy);

  const canSwipeBetweenPrimaryRoutes =
    readiness.hasLlmConfiguration &&
    primaryNavItems.some((item) => item.to === pathname) &&
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  async function handleShareSite() {
    setOpenMenu(null);
    posthog.capture("site_shared");

    try {
      const shared = await shareSiteUrl(shareUrl, shareCopy);

      if (!shared) {
        setIsShareDialogOpen(true);
      }
    } catch (error) {
      if (isShareCancellationError(error)) {
        return;
      }

      pushToast(intl.formatMessage(messages.unableNativeShare));
      setIsShareDialogOpen(true);
    }
  }

  async function handleCopyShareUrl() {
    try {
      const copied = await copySiteShareUrl(shareUrl);

      if (copied) {
        pushToast(intl.formatMessage(messages.copiedLink));
        return;
      }
    } catch {
      // Fall through to the shared failure toast below.
    }

    pushToast(intl.formatMessage(messages.unableCopyLink));
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      const activeMenuRef =
        openMenu === "desktop"
          ? desktopMenuRef
          : openMenu === "mobile"
            ? mobileMenuRef
            : null;

      if (!activeMenuRef?.current || !target) {
        return;
      }

      if (!activeMenuRef.current.contains(target)) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenu]);

  const renderPrimaryNavLink = (item: (typeof primaryNavItems)[number]) => {
    const Icon = item.icon;
    const active = pathname === item.to;
    const className = `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-muted text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

    return (
      <Link
        key={item.to}
        to={item.to}
        className={className}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
        {item.label}
      </Link>
    );
  };

  const renderOverflowMenu = (placement: "desktop" | "mobile") => {
    const isOpen = openMenu === placement;

    return (
      <div
        ref={placement === "desktop" ? desktopMenuRef : mobileMenuRef}
        className="relative"
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-10 px-3 text-muted-foreground hover:text-foreground"
          onClick={() =>
            setOpenMenu((current) => (current === placement ? null : placement))
          }
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={intl.formatMessage(messages.openNavigationMenu)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {isOpen ? (
          <div
            role="menu"
            aria-label={intl.formatMessage(messages.moreNavigation)}
            className="absolute right-0 top-full z-50 mt-2 flex min-w-52 flex-col rounded-2xl border border-border bg-card p-2 shadow-lg"
          >
            {overflowNavItems.map((item) => {
              const Icon = item.icon;

              if (item.type === "action") {
                return (
                  <button
                    key={item.action}
                    type="button"
                    role="menuitem"
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      if (item.action === "share-site") {
                        void handleShareSite();
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                    {item.label}
                  </button>
                );
              }

              if (item.type === "internal") {
                const active = pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    onClick={() => setOpenMenu(null)}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className="h-4 w-4"
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                    {item.label}
                  </Link>
                );
              }

              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => setOpenMenu(null)}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {"menuLabel" in item ? item.menuLabel : item.label}
                </a>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const renderLanguagePicker = (placement: "desktop" | "mobile") => (
    <label className="relative block">
      <span className="sr-only">
        {intl.formatMessage(
          placement === "desktop"
            ? messages.selectLanguageDesktop
            : messages.selectLanguageMobile,
        )}
      </span>
      <select
        aria-label={intl.formatMessage(
          placement === "desktop"
            ? messages.selectLanguageDesktop
            : messages.selectLanguageMobile,
        )}
        value={locale}
        onChange={(event) =>
          dispatch(setLocale(event.target.value as typeof locale))
        }
        className="appearance-none rounded-full border border-border bg-background py-1 px-2.5 pr-2.5 text-xs text-foreground shadow-sm transition-colors hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center"
      >
        {Object.entries(LOCALE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );

  function handlePrimaryNavTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    if (!touch || !canSwipeBetweenPrimaryRoutes) {
      swipeStartRef.current = null;
      return;
    }

    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handlePrimaryNavTouchEnd(event: TouchEvent<HTMLElement>) {
    const touch = event.changedTouches[0];
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!touch || !swipeStart || !canSwipeBetweenPrimaryRoutes) {
      return;
    }

    const nextRoute = getPrimarySwipeDestination({
      currentPath: pathname,
      deltaX: touch.clientX - swipeStart.x,
      deltaY: touch.clientY - swipeStart.y,
    });

    if (!nextRoute) {
      return;
    }

    navigate({ to: nextRoute });
  }

  if (isChromelessRoute) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
      {/* ── Top header / desktop navbar ── */}
      <header className="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center">
          <Link to="/landing" className="flex items-center gap-2.5">
            <img src="/meishi-mark.svg" alt="" className="h-7 w-7" />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              Meishi
            </span>
          </Link>
        </div>

        <nav
          className="hidden items-center justify-center md:flex"
          aria-label={intl.formatMessage(messages.primaryNavigation)}
        >
          <div
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1"
            onTouchStart={handlePrimaryNavTouchStart}
            onTouchEnd={handlePrimaryNavTouchEnd}
            aria-label={intl.formatMessage(messages.primaryNavigationToggle)}
          >
            {primaryNavItems.map((item) => renderPrimaryNavLink(item))}
          </div>
        </nav>

        <div className="flex items-center justify-end self-stretch">
          <div className="flex items-center gap-2 md:hidden">
            {renderLanguagePicker("mobile")}
            {renderOverflowMenu("mobile")}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {renderLanguagePicker("desktop")}
            {renderOverflowMenu("desktop")}
          </div>
        </div>
      </header>

      {/* ── Inline banners ── */}
      {needRefresh ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1">
            {intl.formatMessage(messages.updateAvailableBanner)}
          </span>
          <Button type="button" size="sm" onClick={() => void applyUpdate()}>
            {intl.formatMessage(messages.updateButton)}
          </Button>
        </div>
      ) : null}

      {offlineReady ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1 text-muted-foreground">
            {intl.formatMessage(messages.offlineReadyBanner)}
          </span>
          <button
            type="button"
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={dismissOfflineReady}
            aria-label={intl.formatMessage(messages.dismiss)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {canInstall && !isInstalled ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1">
            {intl.formatMessage(messages.installBanner)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              posthog.capture("pwa_install_prompted");
              void promptInstall();
            }}
          >
            {intl.formatMessage(messages.installButton)}
          </Button>
        </div>
      ) : null}

      {/* ── Main content ── */}
      <main className="flex-1 pb-24 pt-4 md:pb-6">
        <Outlet />
      </main>

      {isShareDialogOpen ? (
        <ShareSiteDialog
          onClose={() => setIsShareDialogOpen(false)}
          onCopy={() => void handleCopyShareUrl()}
          shareLinks={shareLinks}
          url={shareUrl}
        />
      ) : null}

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-center px-4 sm:px-6">
          <div className="flex min-w-0 justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1"
              onTouchStart={handlePrimaryNavTouchStart}
              onTouchEnd={handlePrimaryNavTouchEnd}
              aria-label={intl.formatMessage(messages.primaryNavigationToggle)}
            >
              {primaryNavItems.map((item) => renderPrimaryNavLink(item))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
