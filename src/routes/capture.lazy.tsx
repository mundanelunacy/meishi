import { createLazyFileRoute } from "@tanstack/react-router";
import { CaptureWorkspace } from "../modules/card-capture/CaptureWorkspace";

export const Route = createLazyFileRoute("/capture")({
  component: CaptureWorkspace,
});
