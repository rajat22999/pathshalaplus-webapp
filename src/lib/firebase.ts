/**
 * Firebase Auth client.
 *
 * Firebase's only job here is proving the user controls an identifier — it
 * sends the SMS, checks the OTP, and holds the password. The resulting ID token
 * goes to POST /auth/firebase, which mints our own tokens; the app's session is
 * still ours. Nothing in this file decides *who* the user is.
 *
 * Browser-only: every export throws during SSR rather than silently no-opping.
 */

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  EmailAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";

import {
  FIREBASE_CONFIG,
  FIREBASE_ENABLED,
  RECAPTCHA_CONTAINER_ID,
} from "@/config/env";

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth is browser-only");
  }
  if (!FIREBASE_ENABLED) {
    throw new Error("Firebase is not configured (NEXT_PUBLIC_FIREBASE_*)");
  }
}

function firebaseApp(): FirebaseApp {
  // getApps() guards against re-initialising across Fast Refresh / re-mounts.
  return getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
}

export function getFirebaseAuth(): Auth {
  assertBrowser();
  return getAuth(firebaseApp());
}

// --- reCAPTCHA -------------------------------------------------------------
// Held at module scope, not in component state, so React 19 StrictMode's
// double-invoked effects reuse one widget instead of rendering two into the
// same container (which throws "reCAPTCHA has already been rendered").

let verifier: RecaptchaVerifier | null = null;

function getRecaptchaVerifier(): RecaptchaVerifier {
  if (verifier) return verifier;
  verifier = new RecaptchaVerifier(getFirebaseAuth(), RECAPTCHA_CONTAINER_ID, {
    size: "invisible",
  });
  return verifier;
}

/**
 * Tear down the widget. Required after ANY failed send: a verifier that has
 * already produced a token cannot produce a second one, so reusing it makes
 * every retry fail with the same error the first attempt did.
 */
export function resetRecaptcha(): void {
  const spent = verifier;
  // Drop the reference first, so a throw below cannot strand a dead verifier.
  verifier = null;
  try {
    spent?.clear();
  } catch {
    // Already torn down (container unmounted) — nothing to do.
  }
  // clear() only empties the container for *visible* widgets — see
  // RecaptchaVerifier.clear(): `if (!this.isInvisible) { ...removeChild... }`.
  // Ours is invisible, so its DOM survives and grecaptcha then refuses to
  // render again ("reCAPTCHA has already been rendered"), which would turn
  // every retry into a hard failure.
  if (typeof document !== "undefined") {
    document.getElementById(RECAPTCHA_CONTAINER_ID)?.replaceChildren();
  }
}

// --- phone -----------------------------------------------------------------

/**
 * Start phone sign-in. Returns the `verificationId`.
 *
 * We deliberately return the id rather than the ConfirmationResult object: the
 * id is a plain string, so it can be persisted and the code confirmed after a
 * page reload. Holding the object instead would mean a refresh mid-OTP forces
 * the user to request a second SMS — which we would be billed for.
 */
export async function sendPhoneOtp(
  e164: string,
  languageCode?: string,
): Promise<string> {
  const auth = getFirebaseAuth();
  // Controls the language of the SMS Firebase sends.
  if (languageCode) auth.languageCode = languageCode;

  try {
    const confirmation = await signInWithPhoneNumber(
      auth,
      e164,
      getRecaptchaVerifier(),
    );
    return confirmation.verificationId;
  } finally {
    // Reset on SUCCESS as well as failure: a reCAPTCHA token is single-use, and
    // the SDK already resets the verifier internally once it has been spent.
    // Keeping our reference would hand the next send a consumed verifier — the
    // failure mode that makes "it worked once, then never again" so confusing.
    resetRecaptcha();
  }
}

/** Confirm the SMS code and return a Firebase ID token. */
export async function confirmPhoneOtp(
  verificationId: string,
  code: string,
): Promise<string> {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const result = await signInWithCredential(getFirebaseAuth(), credential);
  return result.user.getIdToken();
}

// --- email + password ------------------------------------------------------

/** Sign in with an email/password credential and return a Firebase ID token. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<string> {
  const result = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return result.user.getIdToken();
}

/**
 * Attach an email/password credential to the *currently signed-in* user and
 * send the verification email.
 *
 * Linking (rather than creating a second account) is what makes "set a password
 * after verifying your phone" work: the Firebase uid is unchanged, so signing in
 * either way afterwards resolves to the same account on our side. Requires a
 * recent phone sign-in — Firebase rejects the link otherwise.
 */
export async function setPasswordForCurrentUser(
  email: string,
  password: string,
): Promise<void> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Verify your mobile number before setting a password");
  }
  const credential = EmailAuthProvider.credential(email.trim(), password);
  await linkWithCredential(user, credential);
  await sendEmailVerification(user);
}

/** Re-send the verification email for the signed-in Firebase user. */
export async function resendVerificationEmail(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in to Firebase");
  await sendEmailVerification(user);
}

/**
 * Whether the signed-in Firebase user has verified their email. Reloads first,
 * because `emailVerified` is a snapshot taken when the token was issued and does
 * not update on its own when the user clicks the link in another tab.
 */
export async function refreshEmailVerified(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  await user.reload();
  return user.emailVerified;
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

/** Current Firebase user, or null. Never throws during SSR. */
export function currentFirebaseUser(): User | null {
  if (typeof window === "undefined" || !FIREBASE_ENABLED) return null;
  try {
    return getAuth(firebaseApp()).currentUser;
  } catch {
    return null;
  }
}

/**
 * Clear the Firebase session. Independent of our own logout: our tokens are
 * what authorize API calls, but leaving a live Firebase session behind would
 * let the next visitor re-mint an ID token.
 */
export async function firebaseSignOut(): Promise<void> {
  if (typeof window === "undefined" || !FIREBASE_ENABLED) return;
  try {
    await signOut(getAuth(firebaseApp()));
  } catch {
    // Never block our own logout on Firebase.
  }
  resetRecaptcha();
}

export { createUserWithEmailAndPassword };
