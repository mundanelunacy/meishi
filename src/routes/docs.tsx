import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "../modules/app-shell/DocsPage";

export const Route = createFileRoute("/docs")({
  component: DocsPage,
});
