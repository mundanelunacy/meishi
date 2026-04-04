import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Camera, ContactRound, ScanSearch, Settings } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import {
  selectGoogleAuth,
  selectHasCompletedOnboarding,
  selectSettings,
} from "../onboarding-settings/onboardingSlice";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Card } from "../../shared/ui/card";
import { usePwaLifecycle } from "../pwa-runtime/usePwaLifecycle";

const navItems = [
  { to: "/capture", label: "Capture", icon: Camera },
  { to: "/review", label: "Review", icon: ScanSearch },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const settings = useAppSelector(selectSettings);
  const googleAuth = useAppSelector(selectGoogleAuth);
  const isReady = useAppSelector(selectHasCompletedOnboarding);
  const { needRefresh, updateServiceWorker } = usePwaLifecycle();

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
                <Badge>{settings.llmProvider}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Google</span>
                <Badge>{googleAuth.accessToken ? "Authorized" : "Pending"}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Mode</span>
                <Badge>{isReady ? "Capture-ready" : "Onboarding"}</Badge>
              </div>
              {needRefresh[0] ? (
                <Button
                  variant="secondary"
                  onClick={() => updateServiceWorker(true)}
                >
                  Update app
                </Button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                    active ? "bg-secondary text-secondary-foreground" : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-primary-foreground/80 hover:bg-white/10"
            >
              <ContactRound className="h-4 w-4" />
              Setup
            </Link>
          </div>
        </div>
      </Card>

      <main className="pb-10">
        <Outlet />
      </main>
    </div>
  );
}
