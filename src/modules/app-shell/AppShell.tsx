import { useEffect, useRef, useState, type TouchEvent } from "react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  Camera,
  Coffee,
  Github,
  Menu,
  ScanSearch,
  Settings,
  X,
} from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { selectAppReadiness } from "../onboarding-settings/onboardingSlice";
import { Button } from "../../shared/ui/button";
import { usePwaLifecycle } from "../pwa-runtime";

const primaryNavItems = [
  { type: "internal", to: "/capture", label: "Capture", icon: Camera },
  { type: "internal", to: "/review", label: "Review", icon: ScanSearch },
] as const;

const overflowNavItems = [
  {
    type: "external",
    href: "https://github.com/mundanelunacy/meishi",
    label: "GitHub",
    icon: Github,
  },
  {
    type: "external",
    href: "https://buymeacoffee.com/mundanelunacy",
    label: "Buy Me a Coffee",
    menuLabel: "Buy Me a Coffee",
    icon: Coffee,
  },
  { type: "internal", to: "/settings", label: "Settings", icon: Settings },
] as const;

export function getPrimarySwipeDestination({
  currentPath,
  deltaX,
  deltaY,
}: {
  currentPath: string;
  deltaX: number;
  deltaY: number;
}) {
  const primaryRouteIndex = primaryNavItems.findIndex(
    (item) => item.to === currentPath,
  );

  if (primaryRouteIndex < 0) {
    return null;
  }

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < 56 || absX < absY * 1.35) {
    return null;
  }

  const nextIndex = deltaX < 0 ? primaryRouteIndex + 1 : primaryRouteIndex - 1;
  return primaryNavItems[nextIndex]?.to ?? null;
}

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const readiness = useAppSelector(selectAppReadiness);
  const {
    applyUpdate,
    canInstall,
    dismissOfflineReady,
    isInstalled,
    needRefresh,
    offlineReady,
    promptInstall,
  } = usePwaLifecycle();
  const [openMenu, setOpenMenu] = useState<"desktop" | "mobile" | null>(null);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const canSwipeBetweenPrimaryRoutes =
    readiness.hasCompletedOnboarding &&
    primaryNavItems.some((item) => item.to === pathname) &&
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 767px)").matches;

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

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
    const isUnlocked = readiness.hasCompletedOnboarding;
    const className = `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-muted text-primary"
        : isUnlocked
          ? "text-muted-foreground hover:bg-muted hover:text-foreground"
          : "pointer-events-none text-muted-foreground/40"
    }`;

    return (
      <Link
        key={item.to}
        to={item.to}
        className={className}
        onClick={(event) => {
          if (!isUnlocked) {
            event.preventDefault();
          }
        }}
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
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {isOpen ? (
          <div
            role="menu"
            aria-label="More navigation"
            className={
              placement === "desktop"
                ? "absolute right-0 top-full z-50 mt-2 flex min-w-52 flex-col rounded-2xl border border-border bg-card p-2 shadow-lg"
                : "absolute bottom-full right-0 z-50 mb-3 flex min-w-52 flex-col rounded-2xl border border-border bg-card p-2 shadow-lg"
            }
          >
            {overflowNavItems.map((item) => {
              const Icon = item.icon;

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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
      {/* ── Top header / desktop navbar ── */}
      <header className="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border">
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
          aria-label="Primary navigation"
        >
          <div
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1"
            onTouchStart={handlePrimaryNavTouchStart}
            onTouchEnd={handlePrimaryNavTouchEnd}
            aria-label="Primary navigation toggle"
          >
            {primaryNavItems.map((item) => renderPrimaryNavLink(item))}
          </div>
        </nav>

        <div className="hidden items-center justify-end self-stretch md:flex">
          {renderOverflowMenu("desktop")}
        </div>
      </header>

      {/* ── Inline banners ── */}
      {needRefresh ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1">A new version is available.</span>
          <Button type="button" size="sm" onClick={() => void applyUpdate()}>
            Update
          </Button>
        </div>
      ) : null}

      {offlineReady ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1 text-muted-foreground">
            Offline shell cached. Extraction and sync still need a connection.
          </span>
          <button
            type="button"
            className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={dismissOfflineReady}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {canInstall && !isInstalled ? (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
          <span className="flex-1">Install Meishi for faster access.</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void promptInstall()}
          >
            Install
          </Button>
        </div>
      ) : null}

      {/* ── Main content ── */}
      <main className="flex-1 pb-24 pt-4 md:pb-6">
        <Outlet />
      </main>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 justify-center">
            <div
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1"
              onTouchStart={handlePrimaryNavTouchStart}
              onTouchEnd={handlePrimaryNavTouchEnd}
              aria-label="Primary navigation toggle"
            >
              {primaryNavItems.map((item) => renderPrimaryNavLink(item))}
            </div>
          </div>
          <div className="flex items-center justify-end">
            {renderOverflowMenu("mobile")}
          </div>
        </div>
      </nav>
    </div>
  );
}
