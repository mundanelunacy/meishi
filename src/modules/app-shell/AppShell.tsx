import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Camera, ContactRound, ScanSearch, Settings } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import {
  selectAppReadiness,
  selectSettings,
} from "../onboarding-settings/onboardingSlice";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { usePwaLifecycle } from "../pwa-runtime";
import { Alert } from "../../shared/ui/alert";

const navItems = [
  { to: "/onboarding", label: "Setup", icon: ContactRound, unlocksAt: "Always available" },
  { to: "/capture", label: "Capture", icon: Camera },
  { to: "/review", label: "Review", icon: ScanSearch },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const settings = useAppSelector(selectSettings);
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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
      <Card className="overflow-hidden border-none bg-transparent shadow-none">
        <div className="flex flex-col gap-8 rounded-[36px] bg-primary px-6 py-8 text-primary-foreground sm:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em]">
                Meishi PWA
              </div>
              <h1 className="font-display text-4xl leading-tight sm:text-5xl">
                Capture cards quickly, verify them carefully, sync them cleanly.
              </h1>
              <p className="max-w-xl text-sm text-primary-foreground/75 sm:text-base">
                Browser-only business-card scanning with Google Contacts sync and LLM-assisted extraction.
              </p>
            </div>

            <div className="grid gap-3 rounded-[28px] bg-white/10 p-5 text-sm text-primary-foreground/85">
              <div className="flex items-center justify-between gap-4">
                <span>LLM</span>
                <Badge>{readiness.hasLlmConfiguration ? settings.llmProvider : "Needs key"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Google</span>
                <Badge>{readiness.hasGoogleAuthorization ? "Authorized" : "Pending"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Mode</span>
                <Badge>{readiness.isCaptureReady ? "Capture-ready" : "Setup in progress"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Auth type</span>
                <Badge>{readiness.googleAuthMode === "mock" ? "Dev mock" : "Real OAuth"}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {canInstall ? (
                  <Button variant="secondary" onClick={() => void promptInstall()}>
                    Install app
                  </Button>
                ) : null}
                {needRefresh ? (
                  <Button variant="secondary" onClick={() => void applyUpdate()}>
                    Update app
                  </Button>
                ) : null}
                {isInstalled ? <Badge>Installed</Badge> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;
              const isUnlocked =
                item.to === "/onboarding" ? true : readiness.hasCompletedOnboarding;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : isUnlocked
                        ? "bg-white/10 hover:bg-white/20"
                        : "cursor-not-allowed bg-white/5 text-primary-foreground/45"
                  }`}
                  onClick={(event) => {
                    if (!isUnlocked) {
                      event.preventDefault();
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {!isUnlocked ? (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-primary-foreground/60">
                      Setup first
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Alert className="border-border/80 bg-card/80 text-foreground">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-medium">Session readiness</p>
              <p className="text-sm text-muted-foreground">
                {readiness.isCaptureReady
                  ? "The app is configured for capture and extraction."
                  : "Finish setup to unlock the working capture flow."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge className={readiness.hasCompletedOnboarding ? "" : "bg-muted text-foreground"}>
                Onboarding {readiness.hasCompletedOnboarding ? "done" : "pending"}
              </Badge>
              <Badge className={readiness.hasLlmConfiguration ? "" : "bg-muted text-foreground"}>
                LLM {readiness.hasLlmConfiguration ? "ready" : "pending"}
              </Badge>
              <Badge className={readiness.hasGoogleAuthorization ? "" : "bg-muted text-foreground"}>
                Google {readiness.hasGoogleAuthorization ? "ready" : "pending"}
              </Badge>
            </div>
          </div>
        </Alert>

        <div className="grid gap-4">
          {needRefresh ? (
            <Alert className="border-border/80 bg-card/80 text-foreground">
              A new Meishi version is ready. Apply the update when you are done with the current session.
            </Alert>
          ) : null}

          {offlineReady ? (
            <Alert className="border-border/80 bg-card/80 text-foreground">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-medium">Offline shell ready</p>
                  <p className="text-sm text-muted-foreground">
                    Meishi can reopen its shell and saved local data offline, but extraction and Google sync still require a network connection.
                  </p>
                </div>
                <Button variant="outline" onClick={dismissOfflineReady}>
                  Dismiss
                </Button>
              </div>
            </Alert>
          ) : null}

          {readiness.requiresGoogleClientId ? (
            <Alert className="border-accent/40 bg-accent/10 text-foreground">
              Real Google OAuth is selected, but <code>VITE_GOOGLE_CLIENT_ID</code> is not set. Add it or switch to development mock auth for local testing.
            </Alert>
          ) : readiness.googleAuthMode === "mock" ? (
            <Alert className="border-accent/40 bg-accent/10 text-foreground">
              Developer mock auth is active. The shell and downstream sync flow are testable locally, but this is not a production Google session.
            </Alert>
          ) : null}
        </div>
      </div>

      <main className="pb-10">
        <Outlet />
      </main>
    </div>
  );
}
