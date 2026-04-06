import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { appEnv, hasFirebaseConfiguration } from "./env";

let emulatorsConnected = false;

function getEmulatorHost() {
  if (typeof window !== "undefined" && window.location.hostname) {
    return window.location.hostname;
  }

  return "127.0.0.1";
}

export function getFirebaseApp() {
  if (!hasFirebaseConfiguration()) {
    throw new Error(
      "Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID."
    );
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: appEnv.firebaseApiKey,
    authDomain: appEnv.firebaseAuthDomain,
    projectId: appEnv.firebaseProjectId,
    appId: appEnv.firebaseAppId,
  });
}

function connectEmulatorsOnce() {
  if (emulatorsConnected || !appEnv.firebaseUseEmulators) {
    return;
  }

  const host = getEmulatorHost();
  const app = getFirebaseApp();
  connectAuthEmulator(getAuth(app), `http://${host}:9099`, {
    disableWarnings: true,
  });
  connectFunctionsEmulator(getFunctions(app, appEnv.firebaseFunctionsRegion), host, 5001);
  emulatorsConnected = true;
}

export function getFirebaseAuth() {
  connectEmulatorsOnce();
  return getAuth(getFirebaseApp());
}

export function getFirebaseFunctions() {
  connectEmulatorsOnce();
  return getFunctions(getFirebaseApp(), appEnv.firebaseFunctionsRegion);
}
