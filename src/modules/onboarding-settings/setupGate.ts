export function getProtectedRouteSetupRedirect(hasLlmConfiguration: boolean) {
  return hasLlmConfiguration ? null : "/setup";
}

export function getSetupRouteRedirect(hasLlmConfiguration: boolean) {
  return hasLlmConfiguration ? "/settings" : null;
}

export function getRootRouteRedirect(hasLlmConfiguration: boolean) {
  return hasLlmConfiguration ? "/capture" : "/landing";
}
