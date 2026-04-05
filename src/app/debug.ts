const DEBUG_QUERY_KEY = "debug";

export function isDebugQueryEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  const value = new URLSearchParams(window.location.search).get(DEBUG_QUERY_KEY);
  return value === "1" || value === "true";
}

export function getDebugQueryKey() {
  return DEBUG_QUERY_KEY;
}
