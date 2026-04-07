import { createLazyFileRoute } from "@tanstack/react-router";
import { ReviewWorkspace } from "../modules/contact-review/ReviewWorkspace";

export const Route = createLazyFileRoute("/review")({
  component: ReviewWorkspace,
});
