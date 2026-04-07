# Shared UI

## Responsibilities

- Hold reusable presentational primitives that can be shared across modules.
- Keep cross-module UI behavior out of feature modules when the behavior is generic.
- Provide stable UI building blocks without taking on module-specific data loading or provider logic.

## Components Documented Here

### `ImageLightbox`

#### Responsibilities

- Render a full-screen modal image viewer.
- Support bounded zoom controls, panning while zoomed, and optional previous/next navigation.
- Show title and subtitle metadata in a fixed header.
- Optionally show a caption overlay that can be toggled by clicking the image.

#### Props contract

- Required: `alt`, `onClose`, `src`, `title`
- Optional: `caption`, `index`, `onNext`, `onPrevious`, `subtitle`, `total`

#### Behavior

- Internal view state is local only: `zoom`, pan `offset`, and `captionsVisible` are not controlled by the parent.
- Whenever `src` changes, the component resets zoom back to `1`, clears pan offset, shows captions again, and cancels any in-progress drag state.
- Zoom is always clamped between `1` and `4`. The header buttons move in `0.5` steps, while wheel and pinch gestures allow finer-grained zooming inside the same bounds.
- Panning only works while zoom is above `1`.
- Desktop wheel input zooms toward the pointer position while the viewer is hovered.
- Mobile pinch gestures zoom around the gesture midpoint and clear any in-progress drag state before the pinch takes over.
- Previous/next buttons render when `total > 1`. In current usage this is paired with `onPrevious` and `onNext` from `Photoroll`.
- Clicking the image toggles captions only when a `caption` prop is provided.

#### Integration notes

- This component is presentation-only. It does not own which image is active; the parent swaps `src` and related metadata.
- The dialog uses a fixed overlay and does not currently implement escape-key handling, focus trapping, or click-outside-to-close behavior.
- The drag cursor stays `grab` while zoomed. There is no separate `grabbing` visual state.
- If a future caller passes `total > 1` without `onPrevious` or `onNext`, navigation buttons still render but will be inert.

#### Change guidance

- Preserve the `src`-reset behavior unless there is an explicit product decision to keep zoom/pan state while stepping between images.
- Treat accessibility changes as behavioral changes. Keyboard navigation and focus management would need deliberate testing.
- Keep this component free of `CapturedCardImage`-specific knowledge so it remains reusable outside capture and review flows.

### `Photoroll`

#### Responsibilities

- Render a responsive grid of `CapturedCardImage` cards.
- Provide a default image footer with filename, dimensions, and capture timestamp.
- Optionally let callers customize per-item classes, overlay actions, and footer content.
- Manage opening and closing the shared `ImageLightbox` for the selected image.

#### Props contract

- Required: `images`
- Optional: `emptyMessage`, `getItemClassName`, `renderFooter`, `renderOverlayAction`

#### Behavior

- An empty `images` array renders the shared `Alert` component with `emptyMessage`.
- Each image tile opens the lightbox for its current index.
- While the lightbox is open, `Photoroll` keeps the selected index in local state.
- If the image list shrinks while the lightbox is open, the selected index is clamped to the new last item.
- If the image list becomes empty while the lightbox is open, the lightbox closes.
- Lightbox previous/next navigation wraps around using modulo arithmetic.

#### Integration notes

- `renderOverlayAction` is rendered inside the image frame at the top-right corner and is responsible for its own interaction semantics.
- `renderFooter` fully replaces the default footer content.
- The lightbox selection is index-based, not id-based. If callers reorder `images` while the lightbox is open, the displayed image may change to the new item at that index.
- `Photoroll` is intentionally typed to `CapturedCardImage[]`, so it is reusable across capture/review flows but not fully generic.

#### Change guidance

- Preserve the index-clamping effect when changing removal or filtering behavior; otherwise the lightbox can point at a stale index.
- If future work needs selection to survive reordering, migrate the lightbox state from index-based tracking to image-id tracking and re-derive the active index for navigation.
- Keep per-item customization at the render-prop level instead of moving feature-specific actions directly into this shared component.

## Boundaries

- Do not put provider-specific logic, route logic, Redux wiring, or persistence behavior in this folder.
- Shared UI components can depend on shared types and shared UI primitives, but feature modules should continue to own business rules.

## Current Gaps

- `ImageLightbox` has no keyboard shortcuts or focus trap yet.
- Neither component currently has dedicated tests in `src/shared/ui`.
- `Photoroll` assumes `CapturedCardImage.dataUrl` is already safe to render and sized appropriately for the browser.
