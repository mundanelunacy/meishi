const primarySwipeRoutes = ["/capture", "/review"] as const;

export function getPrimarySwipeDestination({
  currentPath,
  deltaX,
  deltaY,
}: {
  currentPath: string;
  deltaX: number;
  deltaY: number;
}) {
  const primaryRouteIndex = primarySwipeRoutes.findIndex(
    (route) => route === currentPath,
  );

  if (primaryRouteIndex < 0) {
    return null;
  }

  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  if (absX < 56 || absX < absY * 1.35) {
    return null;
  }

  const nextIndex = deltaX < 0 ? primaryRouteIndex + 1 : primaryRouteIndex - 1;
  return primarySwipeRoutes[nextIndex] ?? null;
}
