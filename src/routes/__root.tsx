import { createRootRouteWithContext } from "@tanstack/react-router";
import { AppShell } from "../modules/app-shell/AppShell";
import type { RootState } from "../app/store";

interface RouterContext {
  store: {
    getState: () => RootState;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
});
