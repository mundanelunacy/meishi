import { createLazyFileRoute } from "@tanstack/react-router";
import { DocsPage } from "../modules/app-shell/DocsPage";

export const Route = createLazyFileRoute("/docs")({
  component: DocsPage,
});
