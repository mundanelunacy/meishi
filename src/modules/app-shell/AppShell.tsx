import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Camera, ContactRound, ScanSearch, Settings, X } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { selectAppReadiness } from "../onboarding-settings/onboardingSlice";
import { Button } from "../../shared/ui/button";
import { usePwaLifecycle } from "../pwa-runtime";

const navItems = [
  { to: "/landing", label: "Home", icon: ContactRound },
  { to: "/capture", label: "Capture", icon: Camera },
  { to: "/review", label: "Review", icon: ScanSearch },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell() {
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

  const statusOk =
    readiness.hasCompletedOnboarding &&
    readiness.hasLlmConfiguration &&
    readiness.hasGoogleAuthorization;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
      {/* ── Top header / desktop navbar ── */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/meishi-mark.svg" alt="" className="h-7 w-7" />
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              Meishi
            </span>
          </Link>

          {/* Desktop nav links — hidden on mobile */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.to ||
                (item.to === "/landing" && pathname === "/");
              const isUnlocked =
                item.to === "/landing" || item.to === "/settings"
                  ? true
                  : readiness.hasCompletedOnboarding;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-muted text-primary"
                      : isUnlocked
                        ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                        : "pointer-events-none text-muted-foreground/40"
                  }`}
                  onClick={(event) => {
                    if (!isUnlocked) {
                      event.preventDefault();
                    }
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <span
          className={`h-2 w-2 rounded-full ${statusOk ? "bg-emerald-500" : "bg-amber-400"}`}
          title={statusOk ? "Ready" : "Setup incomplete"}
        />
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

      {/* ── Bottom tab bar (mobile only) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-around px-4 sm:px-6 lg:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.to ||
              (item.to === "/landing" && pathname === "/");
            const isUnlocked =
              item.to === "/landing" || item.to === "/settings"
                ? true
                : readiness.hasCompletedOnboarding;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : isUnlocked
                      ? "text-muted-foreground hover:text-foreground"
                      : "pointer-events-none text-muted-foreground/40"
                }`}
                onClick={(event) => {
                  if (!isUnlocked) {
                    event.preventDefault();
                  }
                }}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
