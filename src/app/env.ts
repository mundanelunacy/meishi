export const appEnv = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
};

export function hasGoogleClientId() {
  return appEnv.googleClientId.length > 0;
}
