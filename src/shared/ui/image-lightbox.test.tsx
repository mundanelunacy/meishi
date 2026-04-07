// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageLightbox } from "./image-lightbox";

afterEach(() => {
  cleanup();
});

function renderLightbox(src = "first-image.png") {
  return render(
    <ImageLightbox
      alt="Sample image"
      onClose={vi.fn()}
      src={src}
      title="Sample image"
    />,
  );
}

function getImageElements() {
  const image = screen.getByRole("img", { name: "Sample image" });
  const viewport = image.parentElement as HTMLDivElement;

  Object.defineProperty(viewport, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    }),
  });

  viewport.setPointerCapture = vi.fn();
  viewport.hasPointerCapture = vi.fn(() => true);
  viewport.releasePointerCapture = vi.fn();

  return { image, viewport };
}

describe("ImageLightbox", () => {
  it("zooms toward the pointer on wheel input", () => {
    renderLightbox();
    const { image, viewport } = getImageElements();

    fireEvent.wheel(viewport, { deltaY: -100, clientX: 150, clientY: 25 });

    expect(image.style.transform).toBe(
      "translate(-12.5px, 6.25px) scale(1.25)",
    );
  });

  it("resets pan offset when wheel zoom returns to the minimum level", () => {
    renderLightbox();
    const { image, viewport } = getImageElements();

    fireEvent.wheel(viewport, { deltaY: -100, clientX: 150, clientY: 25 });
    fireEvent.wheel(viewport, { deltaY: 100, clientX: 150, clientY: 25 });

    expect(image.style.transform).toBe("translate(0px, 0px) scale(1)");
  });

  it("resets zoom and pan when the source image changes", () => {
    const { rerender } = renderLightbox();
    const { image, viewport } = getImageElements();

    fireEvent.wheel(viewport, { deltaY: -100, clientX: 150, clientY: 25 });

    rerender(
      <ImageLightbox
        alt="Sample image"
        onClose={vi.fn()}
        src="second-image.png"
        title="Sample image"
      />,
    );

    expect(
      screen.getByRole("img", { name: "Sample image" }).style.transform,
    ).toBe("translate(0px, 0px) scale(1)");
  });

  it("supports pinch zoom and clears stale drag state when a pinch starts", () => {
    renderLightbox();
    const { image, viewport } = getImageElements();

    fireEvent.wheel(viewport, { deltaY: -100, clientX: 100, clientY: 50 });
    fireEvent.pointerDown(viewport, {
      clientX: 100,
      clientY: 50,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.touchStart(viewport, {
      touches: [
        { identifier: 1, clientX: 60, clientY: 50 },
        { identifier: 2, clientX: 140, clientY: 50 },
      ],
    });
    fireEvent.touchMove(viewport, {
      touches: [
        { identifier: 1, clientX: 40, clientY: 50 },
        { identifier: 2, clientX: 160, clientY: 50 },
      ],
    });

    expect(image.style.transform).toBe("translate(0px, 0px) scale(1.875)");

    fireEvent.touchEnd(viewport, { touches: [] });
    fireEvent.pointerMove(viewport, {
      clientX: 150,
      clientY: 90,
      pointerId: 1,
      pointerType: "mouse",
    });

    expect(image.style.transform).toBe("translate(0px, 0px) scale(1.875)");
  });
});
