import { Provider } from "react-redux";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { store } from "./store";
import { routeTree } from "../routeTree.gen";
import { Toaster } from "../shared/ui/toaster";

const router = createRouter({
  routeTree,
  context: {
    store,
  },
  defaultPreload: "intent",
  defaultPendingMinMs: 150,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function AppRoot() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster />
    </Provider>
  );
}
